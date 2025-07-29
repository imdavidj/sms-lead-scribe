import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  status: string;
  created_at: string;
  date_added: string;
}

export function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentSegment, setCurrentSegment] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    first_name: '',
    last_name: '', 
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    status: 'No Response'
  });
  const pageSize = 10;

  const loadLeads = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('leads')
        .select('*')
        .order('date_added', { ascending: false });

      // Apply segment filter
      if (currentSegment !== 'All') {
        query = query.eq('status', currentSegment);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading leads:', error);
        return;
      }
      
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [currentSegment, searchTerm]);

  const pushToLeads = async () => {
    try {
      const lead = {
        first_name: newLead.first_name,
        last_name: newLead.last_name,
        phone: newLead.phone,
        email: newLead.email,
        address: newLead.address,
        city: newLead.city,
        state: newLead.state,
        zip: newLead.zip,
        status: newLead.status,
        date_added: new Date().toISOString()
      };

      const { error } = await supabase.from('leads').insert([lead]);
      
      if (error) {
        alert('Error adding lead: ' + error.message);
        return;
      }

      // Reset form and close modal
      setNewLead({
        first_name: '',
        last_name: '', 
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        status: 'No Response'
      });
      setIsAddModalOpen(false);
      
      // Reload leads
      await loadLeads();
    } catch (error) {
      console.error('Error adding lead:', error);
      alert('Error adding lead');
    }
  };

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
    // Since filtering is now done in the query, just return leads as-is for pagination
    return leads;
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
          
          <div className="flex gap-4 items-center justify-between mt-4">
            <div className="flex gap-4 items-center">
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

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Lead</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="fname">First Name</Label>
                      <Input
                        id="fname"
                        value={newLead.first_name}
                        onChange={(e) => setNewLead({...newLead, first_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lname">Last Name</Label>
                      <Input
                        id="lname"
                        value={newLead.last_name}
                        onChange={(e) => setNewLead({...newLead, last_name: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newLead.email}
                      onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={newLead.address}
                      onChange={(e) => setNewLead({...newLead, address: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={newLead.city}
                        onChange={(e) => setNewLead({...newLead, city: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={newLead.state}
                        onChange={(e) => setNewLead({...newLead, state: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP</Label>
                      <Input
                        id="zip"
                        value={newLead.zip}
                        onChange={(e) => setNewLead({...newLead, zip: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={newLead.status} onValueChange={(value) => setNewLead({...newLead, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Qualified">Qualified</SelectItem>
                        <SelectItem value="Unqualified">Unqualified</SelectItem>
                        <SelectItem value="No Response">No Response</SelectItem>
                        <SelectItem value="Blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 justify-end mt-4">
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={pushToLeads}>
                      Add Lead
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Loading leads...
                      </td>
                    </tr>
                  ) : pageLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No leads found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    pageLeads.map((lead) => (
                      <tr key={lead.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">{lead.first_name}</td>
                        <td className="p-4">{lead.last_name}</td>
                        <td className="p-4">{lead.phone}</td>
                        <td className="p-4">{lead.address}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </td>
                        <td className="p-4">{new Date(lead.date_added).toLocaleDateString()}</td>
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