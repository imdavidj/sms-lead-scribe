import { useEffect, useState, useRef } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Send, Phone, Clock, User, Bot } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Conversation, Contact, Message } from "@/types/conversation"

interface ConversationThreadProps {
  conversation: Conversation | null
  onConversationUpdate: () => void
}

export function ConversationThread({ conversation, onConversationUpdate }: ConversationThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [leadFields, setLeadFields] = useState({
    address: "",
    timeline: "",
    reason: "",
    condition: "",
    price: ""
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (conversation) {
      setMessages(conversation.messages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ))
      
      // Extract latest AI summary data
      const latestSummary = conversation.messages
        .filter(msg => msg.ai_summary)
        .reduce((latest, msg) => 
          new Date(msg.created_at) > new Date(latest?.created_at || 0) ? msg : latest
        , null as Message | null)

      if (latestSummary?.ai_summary) {
        setLeadFields({
          address: latestSummary.ai_summary.address || "",
          timeline: latestSummary.ai_summary.timeline || "",
          reason: latestSummary.ai_summary.reason || "",
          condition: latestSummary.ai_summary.condition || "",
          price: latestSummary.ai_summary.price || ""
        })
      }

      // Set up real-time subscription for this conversation
      const subscription = supabase
        .channel(`conversation-${conversation.id}`)
        .on('postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message])
            onConversationUpdate()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(subscription)
      }
    }
  }, [conversation, onConversationUpdate])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return

    setSending(true)
    try {
      const response = await supabase.functions.invoke('reply', {
        body: {
          conversation_id: conversation.id,
          phone: conversation.contact.phone_e164,
          message: newMessage.trim()
        }
      })

      if (response.error) throw response.error

      setNewMessage("")
      toast({
        title: "Message sent",
        description: "Your reply has been sent and forwarded to n8n"
      })
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const updateConversationStatus = async (newStatus: string) => {
    if (!conversation || updatingStatus) return

    setUpdatingStatus(true)
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: newStatus })
        .eq('id', conversation.id)

      if (error) throw error

      onConversationUpdate()
      toast({
        title: "Status updated",
        description: `Conversation marked as ${newStatus}`
      })
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const updateLeadFields = async () => {
    if (!conversation) return

    try {
      // Find the most recent message with AI summary to update
      const latestMessageWithSummary = messages
        .filter(msg => msg.ai_summary)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

      if (latestMessageWithSummary) {
        const { error } = await supabase
          .from('messages')
          .update({ 
            ai_summary: {
              ...latestMessageWithSummary.ai_summary,
              ...leadFields
            }
          })
          .eq('id', latestMessageWithSummary.id)

        if (error) throw error

        toast({
          title: "Lead fields updated",
          description: "Your changes have been saved"
        })
      }
    } catch (error) {
      console.error('Error updating lead fields:', error)
      toast({
        title: "Error",
        description: "Failed to update lead fields",
        variant: "destructive"
      })
    }
  }

  const getContactDisplayName = (contact: Contact) => {
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    }
    return contact.phone_e164
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'qualified': return 'bg-blue-100 text-blue-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a conversation to view details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Messages Thread */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">
                    {getContactDisplayName(conversation.contact)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {conversation.contact.phone_e164}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(conversation.status)}>
                  {conversation.status}
                </Badge>
                <Select 
                  value={conversation.status} 
                  onValueChange={updateConversationStatus}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.direction === 'outbound'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.direction === 'outbound' ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                        <span className="text-xs opacity-70">
                          {message.direction === 'outbound' ? 'Agent' : 'Contact'}
                        </span>
                      </div>
                      <p className="text-sm">{message.body}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Reply Box */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your reply..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  className="resize-none"
                  rows={2}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || sending}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Fields Sidebar */}
      <div className="w-80 ml-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Lead Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Property Address</Label>
              <Input
                id="address"
                value={leadFields.address}
                onChange={(e) => setLeadFields(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter property address"
              />
            </div>

            <div>
              <Label htmlFor="timeline">Timeline</Label>
              <Input
                id="timeline"
                value={leadFields.timeline}
                onChange={(e) => setLeadFields(prev => ({ ...prev, timeline: e.target.value }))}
                placeholder="When do they want to sell?"
              />
            </div>

            <div>
              <Label htmlFor="reason">Reason for Selling</Label>
              <Input
                id="reason"
                value={leadFields.reason}
                onChange={(e) => setLeadFields(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Why are they selling?"
              />
            </div>

            <div>
              <Label htmlFor="condition">Property Condition</Label>
              <Input
                id="condition"
                value={leadFields.condition}
                onChange={(e) => setLeadFields(prev => ({ ...prev, condition: e.target.value }))}
                placeholder="Property condition"
              />
            </div>

            <div>
              <Label htmlFor="price">Expected Price</Label>
              <Input
                id="price"
                value={leadFields.price}
                onChange={(e) => setLeadFields(prev => ({ ...prev, price: e.target.value }))}
                placeholder="Expected selling price"
              />
            </div>

            <Button onClick={updateLeadFields} className="w-full">
              Save Lead Information
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}