import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Phone, MessageCircle, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Conversation, Contact } from "@/types/conversation"

interface ConversationsListProps {
  onSelectConversation: (conversation: Conversation) => void
  selectedConversationId?: string
}

export function ConversationsList({ onSelectConversation, selectedConversationId }: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchConversations()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('conversations-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations' },
        () => fetchConversations()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => fetchConversations()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const fetchConversations = async () => {
    try {
      console.log('Fetching conversations...')
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          contact_id,
          status,
          last_msg_at,
          created_at,
          contact:contacts(
            id,
            phone_e164,
            first_name,
            last_name
          ),
          messages(
            id,
            conversation_id,
            body,
            direction,
            created_at,
            ai_summary,
            twilio_sid
          )
        `)
        .order('last_msg_at', { ascending: false, nullsFirst: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Conversations fetched successfully:', data?.length || 0)
      setConversations((data || []) as Conversation[])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      conv.contact.phone_e164.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.messages.some(msg => 
        msg.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (msg.ai_summary?.address && msg.ai_summary.address.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    
    const matchesStatus = statusFilter === "all" || conv.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'qualified': return 'bg-blue-100 text-blue-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLastMessage = (messages: Conversation['messages']) => {
    if (!messages.length) return null
    return messages.reduce((latest, msg) => 
      new Date(msg.created_at) > new Date(latest.created_at) ? msg : latest
    )
  }

  const getContactDisplayName = (contact: Conversation['contact']) => {
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    }
    return contact.phone_e164
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filteredConversations.map((conversation) => {
          const lastMessage = getLastMessage(conversation.messages)
          const isSelected = conversation.id === selectedConversationId
          
          return (
            <Card 
              key={conversation.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelectConversation(conversation)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {getContactDisplayName(conversation.contact)}
                    </span>
                  </div>
                  <Badge className={getStatusColor(conversation.status)}>
                    {conversation.status}
                  </Badge>
                </div>
                
                {lastMessage && (
                  <div className="flex items-start gap-2 mb-2">
                    <MessageCircle className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                      {lastMessage.direction === 'outbound' ? '→ ' : '← '}
                      {lastMessage.body}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {conversation.last_msg_at 
                        ? formatDistanceToNow(new Date(conversation.last_msg_at), { addSuffix: true })
                        : formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })
                      }
                    </span>
                  </div>
                  <span>{conversation.messages.length} messages</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredConversations.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "No conversations match your filters"
                : "No conversations yet"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}