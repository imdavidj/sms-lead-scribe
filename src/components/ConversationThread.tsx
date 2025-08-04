import React, { useState, useEffect, useRef } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Send, Phone, Clock, User, Bot, UserPlus } from "lucide-react"
import { SendToCRMModal } from "@/components/SendToCRMModal"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Conversation, Contact, Message } from "@/types/conversation"

// AI Classification interface
interface AIClassification {
  tag: string;
  pushback: string;
}

// Global leads array interface
interface Lead {
  fname: string;
  lname: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  status: string;
  date: string;
}

// Declare global leads array
declare global {
  interface Window {
    globalLeads: Lead[];
  }
}

// Initialize global leads array if it doesn't exist
if (typeof window !== 'undefined' && !window.globalLeads) {
  window.globalLeads = [];
}

interface ConversationThreadProps {
  conversation: Conversation | null
  onConversationUpdate: () => void
}

export function ConversationThread({ conversation, onConversationUpdate }: ConversationThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sendingPushback, setSendingPushback] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [messageClassifications, setMessageClassifications] = useState<Record<string, AIClassification>>({})
  const [leadFields, setLeadFields] = useState({
    address: "",
    timeline: "",
    reason: "",
    condition: "",
    price: ""
  })
  const [tag, setTag] = useState<string | null>(null);
  const [pushback, setPushback] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (conversation) {
      setPhone(conversation.contact.phone_e164);
    }
  }, [conversation]);

  useEffect(() => {
    if (pushback && phone) {
      fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone,
          message: pushback
        }),
      })
      .then(() => console.log("Pushback sent"))
      .catch(console.error);
    }
  }, [pushback, phone]);

  useEffect(() => {
    if (!messages.length) return;
    async function classify() {
      try {
        const res = await fetch("https://n1agetns.app.n8n.cloud/webhook-test/webhook/ai-classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            direction: "inbound",
            body: messages[messages.length - 1].body,
          }),
        });
        const data = await res.json();
        setTag(data.tag);
        setPushback(data.pushback);
      } catch (err) {
        console.error("Classification failed", err);
      }
    }
    classify();
  }, [messages, phone]);

  // AI Classification function
  const classifyMessage = async (messageText: string, messageId: string) => {
    try {
      const response = await supabase.functions.invoke('ai-classify', {
        body: { text: messageText }
      });
      
      if (response.error) {
        console.error('Error classifying message:', response.error);
        return;
      }

      if (response.data) {
        const { tag, pushback } = response.data;
        setMessageClassifications(prev => ({
          ...prev,
          [messageId]: { tag, pushback }
        }));
      }
    } catch (error) {
      console.error('Error classifying message:', error);
    }
  };

  useEffect(() => {
    if (conversation) {
      const sortedMessages = conversation.messages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      setMessages(sortedMessages)
      
      // Classify inbound messages on load
      sortedMessages.forEach(message => {
        if (message.direction === 'inbound' && !messageClassifications[message.id]) {
          classifyMessage(message.body, message.id)
        }
      })
      
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
            const newMessage = payload.new as Message
            setMessages(prev => [...prev, newMessage])
            
            // Classify new inbound messages
            if (newMessage.direction === 'inbound') {
              classifyMessage(newMessage.body, newMessage.id)
            }
            
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
          phone: phone,
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

  const addToLeads = () => {
    if (!conversation) return;

    const lead: Lead = {
      fname: conversation.contact.first_name || '',
      lname: conversation.contact.last_name || '',
      phone: phone,
      email: '', // Not available in current conversation data
      address: leadFields.address,
      city: '', // Would need to extract from address
      state: '', // Would need to extract from address
      zip: '', // Would need to extract from address
      status: 'All',
      date: new Date().toISOString().slice(0, 10)
    };

    // Add to global leads array
    if (typeof window !== 'undefined') {
      if (!window.globalLeads) {
        window.globalLeads = [];
      }
      window.globalLeads.push(lead);
      
      // Trigger custom event for leads view update
      const event = new CustomEvent('leadsUpdated', { 
        detail: window.globalLeads 
      });
      window.dispatchEvent(event);
    }
    
    toast({
      title: "Added to leads",
      description: "Contact has been added to the leads list"
    });
  };

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

  // Get the latest AI classification for this conversation
  const getLatestClassification = (): AIClassification | null => {
    const inboundMessages = messages.filter(msg => msg.direction === 'inbound')
    if (inboundMessages.length === 0) return null
    
    const latestInbound = inboundMessages[inboundMessages.length - 1]
    return messageClassifications[latestInbound.id] || null
  }

  // Get AI tag badge styling
  const getTagBadgeStyle = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'hot': return 'bg-green-100 text-green-800 border-green-200'
      case 'warm': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'cold': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Send pushback message
  const sendPushback = async (pushbackText: string) => {
    if (!conversation || sendingPushback) return

    setSendingPushback(true)
    try {
      const response = await supabase.functions.invoke('reply', {
        body: {
          conversation_id: conversation.id,
          phone: phone,
          message: pushbackText
        }
      })

      if (response.error) throw response.error

      console.log('Pushback sent:', {
        conversation_id: conversation.id,
        phone: phone,
        pushback_text: pushbackText,
        timestamp: new Date().toISOString()
      })

      toast({
        title: "Pushback sent",
        description: "AI-suggested pushback has been sent successfully"
      })
    } catch (error) {
      console.error('Error sending pushback:', error)
      toast({
        title: "Error",
        description: "Failed to send pushback message",
        variant: "destructive"
      })
    } finally {
      setSendingPushback(false)
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
      <div className="flex-1 flex flex-col h-full">
        <Card className="flex-1 flex flex-col h-full">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <div>
                    <CardTitle className="text-lg">
                      {getContactDisplayName(conversation.contact)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {conversation.contact.phone_e164}
                    </p>
                  </div>
                  {/* AI Tag Badge next to lead name */}
                  {(() => {
                    const latestClassification = getLatestClassification();
                    return latestClassification?.tag ? (
                      <Badge className={`${getTagBadgeStyle(latestClassification.tag)} border`}>
                        {latestClassification.tag.toUpperCase()}
                      </Badge>
                    ) : null;
                  })()}
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

          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Tag Badge at top of thread panel */}
            {tag && (
              <div className="p-4 border-b">
                <Badge className={`${getTagBadgeStyle(tag)} border`}>
                  {tag.toUpperCase()}
                </Badge>
              </div>
            )}
            {/* Classification Header */}
            <div className="classification-header">
              {tag && (
                <span className={`badge badge--${tag}`}>
                  {tag.toUpperCase()}
                </span>
              )}
              {pushback && (
                <div className="pushback-card border rounded p-4 shadow">
                  <h4 className="font-semibold mb-2">Suggested Pushback</h4>
                  <p className="mb-4">{pushback}</p>
                  <button
                    onClick={async () => {
                      await fetch("/webhook/send-sms", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          To: phone,
                          Body: pushback
                        }),
                      });
                    }}
                    className="btn btn-primary"
                  >
                    Send Pushback
                  </button>
                </div>
              )}
            </div>
            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 space-y-4">
                {messages.map((message) => {
                  const classification = messageClassifications[message.id];
                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[70%] space-y-2">
                        <div
                          className={`rounded-lg p-3 ${
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
                            {/* AI Classification Tag */}
                            {classification && message.direction === 'inbound' && (
                              <Badge variant="secondary" className="text-xs">
                                {classification.tag}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{message.body}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        
                        {/* AI Pushback Suggestion */}
                        {classification && classification.pushback && message.direction === 'inbound' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <Bot className="h-4 w-4 text-blue-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs font-medium text-blue-800 mb-1">AI Suggested Response:</p>
                                <p className="text-sm text-blue-700">{classification.pushback}</p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 h-6 text-xs"
                                  onClick={() => setNewMessage(classification.pushback)}
                                >
                                  Use This Response
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
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

            {/* Suggested Pushback Section */}
            {(() => {
              const latestClassification = getLatestClassification();
              return latestClassification?.pushback ? (
                <Card className="border border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Suggested Pushback
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-orange-700 mb-3">{latestClassification.pushback}</p>
                    <Button 
                      onClick={() => sendPushback(latestClassification.pushback)}
                      disabled={sendingPushback}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      size="sm"
                    >
                      {sendingPushback ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3 mr-2" />
                          Send Pushback
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : null;
            })()}

            <div className="space-y-2">
              <Button onClick={updateLeadFields} className="w-full">
                Save Lead Information
              </Button>
              <div className="flex gap-2">
                <SendToCRMModal conversation={conversation} />
                <Button 
                  onClick={addToLeads} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add to Leads
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}