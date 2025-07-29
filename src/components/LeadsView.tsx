import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

// Global leads array - same as in ConversationThread
declare global {
  interface Window {
    globalLeads: Lead[];
  }
}

// Initialize global leads array if it doesn't exist
if (typeof window !== 'undefined' && !window.globalLeads) {
  window.globalLeads = [
    { fname: 'John', lname: 'Doe', phone: '555-1234', email: '', address: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345', status: 'Qualified', date: '2025-07-29' },
    { fname: 'Jane', lname: 'Smith', phone: '555-5678', email: '', address: '456 Oak Ave', city: 'Somewhere', state: 'NY', zip: '67890', status: 'Unqualified', date: '2025-07-28' },
    { fname: 'Mike', lname: 'Johnson', phone: '555-9012', email: '', address: '789 Pine St', city: 'Elsewhere', state: 'TX', zip: '54321', status: 'No Response', date: '2025-07-27' }
  ];
}

export function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentSegment, setCurrentSegment] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 10;

  useEffect(() => {
    // Load initial leads from global array
    if (typeof window !== 'undefined' && window.globalLeads) {
      setLeads([...window.globalLeads]);
    }

    // Listen for leads updates
    const handleLeadsUpdate = (event: CustomEvent) => {
      if (event.detail) {
        setLeads([...event.detail]);
      }
    };

    window.addEventListener('leadsUpdated', handleLeadsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('leadsUpdated', handleLeadsUpdate as EventListener);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'unqualified': return 'bg-red-100 text-red-800';
      case 'no response': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    // Filter by segment
    if (currentSegment !== 'All') {
      filtered = filtered.filter(lead => lead.status === currentSegment);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.fname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredLeads = filterLeads();
  const totalLeads = filteredLeads.length;
  const totalPages = Math.ceil(totalLeads / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalLeads);
  const pageLeads = filteredLeads.slice(startIndex, endIndex);

  const handleSegmentChange = (value: string) => {
    setCurrentSegment(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Leads</CardTitle>
          <p className="text-muted-foreground">Manage and track your lead qualification pipeline</p>
          
          <div className="flex gap-4 items-center mt-4">
            <Select value={currentSegment} onValueChange={handleSegmentChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Leads</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Unqualified">Unqualified</SelectItem>
                <SelectItem value="No Response">No Response</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Search leads by name, phone, or address..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-[400px]"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left font-medium">First Name</th>
                    <th className="p-4 text-left font-medium">Last Name</th>
                    <th className="p-4 text-left font-medium">Phone</th>
                    <th className="p-4 text-left font-medium">Address</th>
                    <th className="p-4 text-left font-medium">Status</th>
                    <th className="p-4 text-left font-medium">Date Added</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No leads found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    pageLeads.map((lead, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-4">{lead.fname}</td>
                        <td className="p-4">{lead.lname}</td>
                        <td className="p-4">{lead.phone}</td>
                        <td className="p-4">{lead.address}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </td>
                        <td className="p-4">{new Date(lead.date).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {totalLeads === 0 ? 'No leads to display' : `Showing ${startIndex + 1}-${endIndex} of ${totalLeads} leads`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <span className="text-sm px-2">
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}