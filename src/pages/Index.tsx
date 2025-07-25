import { useState } from "react";
import { ConversationsList } from "@/components/ConversationsList";
import { ConversationThread } from "@/components/ConversationThread";
import { Conversation } from "@/types/conversation";
const Index = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const handleConversationUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 bg-slate-100 rounded-none">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">SMS Lead Qualifier Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your SMS conversations and track lead information
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          <div className="lg:col-span-1 overflow-hidden">
            <h2 className="text-xl font-semibold mb-4">Conversations</h2>
            <div className="h-full overflow-y-auto pr-2">
              <ConversationsList onSelectConversation={setSelectedConversation} selectedConversationId={selectedConversation?.id} key={refreshKey} />
            </div>
          </div>
          
          <div className="lg:col-span-2 overflow-hidden">
            <ConversationThread conversation={selectedConversation} onConversationUpdate={handleConversationUpdate} />
          </div>
        </div>
      </div>
    </div>;
};
export default Index;