import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Upload, FileText, Trash2, MoreVertical } from 'lucide-react';

interface ListData {
  name: string;
  mapping: Record<string, { index: number; header: string }>;
  data: any[];
  dateAdded: string;
  recordCount: number;
  dateUsed?: string;
}

const mappingOptions = [
  { value: '', label: 'Select field...' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'fname', label: 'First Name' },
  { value: 'lname', label: 'Last Name' },
  { value: 'address', label: 'Address' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'zip', label: 'ZIP Code' },
  { value: 'email', label: 'Email' },
  { value: 'custom1', label: 'Custom Field 1' },
  { value: 'custom2', label: 'Custom Field 2' }
];

export const UploadLists = () => {
  const [savedLists, setSavedLists] = useState<ListData[]>([]);
  const [usedLists, setUsedLists] = useState<ListData[]>([]);
  const [currentFileData, setCurrentFileData] = useState<any[] | null>(null);
  const [currentMapping, setCurrentMapping] = useState<Record<string, { index: number; header: string }>>({});
  const [currentFileName, setCurrentFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = (file: File) => {
    if (!file) return;

    setCurrentFileName(file.name.replace(/\.[^/.]+$/, ""));
    
    if (file.name.endsWith('.csv')) {
      // Simple CSV parsing - in production, use a library like papaparse
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        
        setHeaders(headers);
        setCurrentFileData(data);
        setCurrentMapping({});
        setShowPreview(true);
      };
      reader.readAsText(file);
    } else {
      alert('Only CSV files are supported in this demo');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileImport(files[0]);
    }
  };

  const saveList = () => {
    if (!currentFileData || !currentFileName) {
      alert('No file data to save');
      return;
    }

    const listData: ListData = {
      name: currentFileName,
      mapping: currentMapping,
      data: currentFileData,
      dateAdded: new Date().toLocaleDateString(),
      recordCount: currentFileData.length
    };

    setSavedLists(prev => [...prev, listData]);
    
    // Reset form
    setCurrentFileData(null);
    setCurrentMapping({});
    setCurrentFileName('');
    setHeaders([]);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    alert('List saved successfully!');
  };

  const deleteList = (index: number) => {
    if (confirm('Are you sure you want to delete this list?')) {
      setSavedLists(prev => prev.filter((_, i) => i !== index));
    }
  };

  const markAsUsed = (index: number) => {
    const list = savedLists[index];
    const usedList = { ...list, dateUsed: new Date().toLocaleDateString() };
    
    setUsedLists(prev => [...prev, usedList]);
    setSavedLists(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="saved" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="saved">Saved Lists</TabsTrigger>
          <TabsTrigger value="used">Used Lists</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="space-y-6">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import CSV File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Import CSV File</h3>
                <p className="text-muted-foreground mb-4">Drag and drop your file here or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleFileImport(e.target.files[0])}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
              </div>

              {/* Column Mapping */}
              {showPreview && headers.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Map Columns</h3>
                  <div className="space-y-3">
                    {headers.map((header, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                        <label className="font-medium min-w-[120px]">{header}</label>
                        <select
                          className="flex-1 p-2 border border-border rounded-md bg-background"
                          onChange={(e) => {
                            if (e.target.value) {
                              setCurrentMapping(prev => ({
                                ...prev,
                                [e.target.value]: { index, header }
                              }));
                            }
                          }}
                        >
                          {mappingOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {showPreview && currentFileData && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Preview (First 5 rows)</h3>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          {headers.map((header, index) => (
                            <th key={index} className="p-3 text-left font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentFileData.slice(0, 5).map((row, index) => (
                          <tr key={index} className="border-t hover:bg-muted/50">
                            {headers.map((header, headerIndex) => (
                              <td key={headerIndex} className="p-3">
                                {row[header] || ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button onClick={saveList} className="mt-4">
                    Save List
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Lists Table */}
          <Card>
            <CardHeader>
              <CardTitle>Saved Lists</CardTitle>
            </CardHeader>
            <CardContent>
              {savedLists.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No saved lists yet. Upload a file to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-3 text-left font-medium">List Name</th>
                        <th className="p-3 text-left font-medium"># Records</th>
                        <th className="p-3 text-left font-medium">Date Saved</th>
                        <th className="p-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedLists.map((list, index) => (
                        <tr key={index} className="border-t hover:bg-muted/50">
                          <td className="p-3 font-medium">{list.name}</td>
                          <td className="p-3">
                            <Badge variant="secondary">{list.recordCount}</Badge>
                          </td>
                          <td className="p-3">{list.dateAdded}</td>
                          <td className="p-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => markAsUsed(index)}>
                                  Mark as Used
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => deleteList(index)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="used" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Used Lists</CardTitle>
            </CardHeader>
            <CardContent>
              {usedLists.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No used lists yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-3 text-left font-medium">List Name</th>
                        <th className="p-3 text-left font-medium"># Records</th>
                        <th className="p-3 text-left font-medium">Date Marked Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usedLists.map((list, index) => (
                        <tr key={index} className="border-t hover:bg-muted/50">
                          <td className="p-3 font-medium">{list.name}</td>
                          <td className="p-3">
                            <Badge variant="secondary">{list.recordCount}</Badge>
                          </td>
                          <td className="p-3">{list.dateUsed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};