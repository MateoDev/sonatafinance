import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { InsertFinancialNote } from "@shared/schema";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import MarkdownEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { 
  MessageCircle,
  Plus,
  Search,
  CalendarDays,
  Tag,
  Trash,
  Edit,
  Check,
  X,
  FolderTree,
  FileText,
  Star,
  StarOff,
  ChevronRight,
  ChevronDown,
  Grid2x2,
  List,
  Copy,
  Pin
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Mock note data
const mockNotes = [
  {
    id: 1,
    title: "Monthly Budget Review",
    content: "Need to review and adjust the monthly budget for groceries and utilities. Consider shifting some funds from entertainment to savings.",
    category: "Budget",
    date: "2025-04-15",
    tags: ["budget", "review", "planning"]
  },
  {
    id: 2,
    title: "Investment Portfolio Strategy",
    content: "Research tech stocks for potential diversification. Consider increasing allocation to index funds. Schedule meeting with financial advisor.",
    category: "Investments",
    date: "2025-04-10",
    tags: ["investments", "planning", "stocks"]
  },
  {
    id: 3,
    title: "Mortgage Refinance Options",
    content: "Current rate: 4.2%. Research options for refinancing to lower rate. Check Quicken Loans, Bank of America, and local credit union rates.",
    category: "Liabilities",
    date: "2025-03-28",
    tags: ["mortgage", "refinance", "research"]
  },
  {
    id: 4,
    title: "Retirement Plan Contributions",
    content: "Increase 401k contribution by 2% after next promotion. Research Roth IRA conversion options. Check annual contribution limits.",
    category: "Goals",
    date: "2025-04-02",
    tags: ["retirement", "planning", "401k"]
  },
  {
    id: 5,
    title: "Tax Planning Notes",
    content: "Schedule meeting with accountant to discuss tax optimization strategies. Gather receipts for potential deductions. Research home office deduction requirements.",
    category: "Tax",
    date: "2025-03-15",
    tags: ["tax", "planning", "deductions"]
  }
];

// Helper to format dates
function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Get a random subtle color for category badges
function getCategoryColor(category: string) {
  const colors = {
    "Budget": "bg-blue-50 text-blue-700 border-blue-200",
    "Investments": "bg-green-50 text-green-700 border-green-200",
    "Liabilities": "bg-red-50 text-red-700 border-red-200",
    "Goals": "bg-purple-50 text-purple-700 border-purple-200",
    "Tax": "bg-amber-50 text-amber-700 border-amber-200",
    "Insurance": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "General": "bg-gray-50 text-gray-700 border-gray-200",
  };
  
  return colors[category as keyof typeof colors] || colors["General"];
}

interface Note {
  id: number;
  title: string;
  content: string;
  category: string;
  folder?: string;
  recordDate: Date;
  tags: string[];
  userId: number;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function Notes() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterFolder, setFilterFolder] = useState<string | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // Form state for new/editing note
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    category: "General",
    folder: "",
    tags: ""
  });
  
  // Fetch notes from the API
  const { data: fetchedNotes, isLoading } = useQuery({
    queryKey: ["/api/notes"],
    queryFn: async () => {
      const response = await fetch("/api/notes");
      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }
      return await response.json();
    }
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: Omit<InsertFinancialNote, "userId">) => {
      const response = await apiRequest("POST", "/api/notes", noteData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note created",
        description: "Your note has been added successfully"
      });
      setIsAddingNote(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create note",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<InsertFinancialNote> }) => {
      const response = await apiRequest("PATCH", `/api/notes/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully"
      });
      setEditingNoteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update note",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete note",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Use fetched notes from the API
  useEffect(() => {
    if (fetchedNotes) {
      console.log("Fetched notes:", fetchedNotes);
    }
  }, [fetchedNotes]);

  // Filter notes based on search term, category, and folder
  const filteredNotes = fetchedNotes ? fetchedNotes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
    const matchesCategory = filterCategory ? note.category === filterCategory : true;
    const matchesFolder = filterFolder ? note.folder === filterFolder : true;
    
    return matchesSearch && matchesCategory && matchesFolder;
  }) : [];
  
  // Function to get all folders from notes
  const getFolders = () => {
    if (!fetchedNotes) return [];
    
    const folders = new Set<string>();
    fetchedNotes.forEach(note => {
      if (note.folder) {
        folders.add(note.folder);
      }
    });
    
    return Array.from(folders).sort();
  };
  
  // Group notes by folder
  const getNotesByFolder = () => {
    const folderMap: { [key: string]: Note[] } = {};
    
    // Group notes by folder
    filteredNotes.forEach(note => {
      const folder = note.folder || 'Uncategorized';
      if (!folderMap[folder]) {
        folderMap[folder] = [];
      }
      folderMap[folder].push(note);
    });
    
    return folderMap;
  };
  
  // Toggle folder expansion
  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folder)) {
        newSet.delete(folder);
      } else {
        newSet.add(folder);
      }
      return newSet;
    });
  };
  
  // Handle note selection
  const handleSelectNote = (note: Note) => {
    setSelectedNoteId(note.id);
  };
  
  // Toggle note pin status
  const handleTogglePin = (note: Note) => {
    updateNoteMutation.mutate({
      id: note.id,
      data: {
        isPinned: !note.isPinned
      }
    });
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setIsAddingNote(false);
    setEditingNoteId(null);
  };
  
  // Start adding a new note
  const handleAddNote = () => {
    setNoteForm({
      title: "",
      content: "",
      category: "General",
      folder: filterFolder || "",
      tags: ""
    });
    setIsAddingNote(true);
    setSelectedNoteId(null);
  };
  
  // Start editing an existing note
  const handleEditNote = (note: Note) => {
    setNoteForm({
      title: note.title,
      content: note.content,
      category: note.category,
      folder: note.folder || "",
      tags: note.tags.join(", ")
    });
    setEditingNoteId(note.id);
    setSelectedNoteId(null);
  };
  
  // Save new or edited note
  const handleSaveNote = () => {
    if (!noteForm.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note",
        variant: "destructive"
      });
      return;
    }
    
    // Process tags from comma-separated string to array
    const tagArray = noteForm.tags
      ? noteForm.tags.split(",").map(tag => tag.trim()).filter(tag => tag)
      : [];
    
    if (editingNoteId !== null) {
      // Update existing note using mutation
      updateNoteMutation.mutate({
        id: editingNoteId,
        data: {
          title: noteForm.title,
          content: noteForm.content,
          category: noteForm.category as any, // Type compatibility workaround
          folder: noteForm.folder,
          tags: tagArray
        }
      });
    } else {
      // Add new note using mutation
      createNoteMutation.mutate({
        title: noteForm.title,
        content: noteForm.content,
        category: noteForm.category as any, // Type compatibility workaround
        folder: noteForm.folder,
        recordDate: new Date(),
        tags: tagArray,
        isPinned: false
      });
    }
  };
  
  // Delete a note
  const handleDeleteNote = (id: number) => {
    deleteNoteMutation.mutate(id);
  };
  
  // Get all unique categories for the filter
  const categories = fetchedNotes 
    ? Array.from(new Set(fetchedNotes.map(note => note.category)))
    : [];

  // Function to get the selected note
  const getSelectedNote = () => {
    if (!selectedNoteId || !fetchedNotes) return null;
    return fetchedNotes.find(note => note.id === selectedNoteId) || null;
  };
  
  // Folder tree view component
  const FolderTreeView = () => {
    const folders = getFolders();
    const folderMap = getNotesByFolder();
    
    return (
      <div className="h-[calc(100vh-220px)] overflow-y-auto pr-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-sm text-muted-foreground">FOLDERS</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add new folder</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="space-y-1">
          <Button 
            variant={!filterFolder ? "secondary" : "ghost"} 
            className="w-full justify-start" 
            size="sm"
            onClick={() => setFilterFolder(null)}
          >
            <FileText className="h-4 w-4 mr-2" />
            All Notes
          </Button>
          
          {folders.map(folder => {
            const isExpanded = expandedFolders.has(folder);
            const noteCount = folderMap[folder]?.length || 0;
            
            return (
              <div key={folder} className="space-y-1">
                <Button 
                  variant={filterFolder === folder ? "secondary" : "ghost"} 
                  className="w-full justify-between group" 
                  size="sm"
                  onClick={() => setFilterFolder(folder === filterFolder ? null : folder)}
                >
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 mr-1 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFolder(folder);
                      }}
                    >
                      {isExpanded ? 
                        <ChevronDown className="h-3 w-3" /> : 
                        <ChevronRight className="h-3 w-3" />
                      }
                    </Button>
                    <FolderTree className="h-4 w-4 mr-2" />
                    <span className="truncate">{folder}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{noteCount}</Badge>
                </Button>
                
                {isExpanded && folderMap[folder] && (
                  <div className="ml-6 space-y-1 border-l pl-2">
                    {folderMap[folder].map(note => (
                      <Button 
                        key={note.id}
                        variant={selectedNoteId === note.id ? "secondary" : "ghost"} 
                        className="w-full justify-start text-sm h-8" 
                        size="sm"
                        onClick={() => handleSelectNote(note)}
                      >
                        <FileText className="h-3 w-3 mr-2 opacity-70" />
                        <span className="truncate">{note.title}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Note detail view
  const NoteDetailView = () => {
    const selectedNote = getSelectedNote();
    
    if (!selectedNote) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-220px)]">
          <div className="text-center max-w-md">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No note selected</h3>
            <p className="text-muted-foreground mb-4">
              Select a note from the sidebar or create a new one
            </p>
            <Button onClick={handleAddNote}>
              <Plus className="h-4 w-4 mr-1" />
              New Note
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <Card className="h-[calc(100vh-220px)] overflow-hidden flex flex-col">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{selectedNote.title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Badge variant="outline" className={`text-xs mr-2 ${getCategoryColor(selectedNote.category)}`}>
                {selectedNote.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Last updated: {formatDate(selectedNote.updatedAt.toString())}
              </span>
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleTogglePin(selectedNote)}
                  >
                    {selectedNote.isPinned ? 
                      <Star className="h-4 w-4 text-yellow-500" /> : 
                      <StarOff className="h-4 w-4" />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{selectedNote.isPinned ? "Unpin note" : "Pin note"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleEditNote(selectedNote)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit note</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteNote(selectedNote.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete note</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-y-auto pb-8">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {selectedNote.content}
            </ReactMarkdown>
          </div>
          
          {selectedNote.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-6 pt-4 border-t">
              {selectedNote.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Main Notes UI
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financial Notes</h1>
        
        <div className="flex gap-2">
          <div className="flex border rounded-md">
            <Button 
              variant={viewMode === 'grid' ? "secondary" : "ghost"} 
              size="icon" 
              className="rounded-none rounded-l-md"
              onClick={() => setViewMode('grid')}
            >
              <Grid2x2 className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? "secondary" : "ghost"} 
              size="icon" 
              className="rounded-none rounded-r-md"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Chat button */}
          <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Chat with your Financial AI</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <ScrollArea className="h-[70vh]">
                  <div className="flex flex-col gap-4 p-2">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">How can I help with your financial notes today?</p>
                    </div>
                    {/* Chat content will go here */}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Notes controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative w-full md:max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search notes by title, content, or tags..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={filterCategory || ""} onValueChange={(val) => setFilterCategory(val || null)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleAddNote} className="ml-auto md:ml-0 flex-shrink-0">
            <Plus className="h-5 w-5 mr-2" />
            <span>New Note</span>
          </Button>
        </div>
      </div>

      {/* Note Editor Dialog */}
      <Dialog open={isAddingNote || editingNoteId !== null} onOpenChange={(open) => {
        if (!open) {
          setIsAddingNote(false);
          setEditingNoteId(null);
        }
      }}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNoteId !== null ? "Edit Note" : "Create New Note"}</DialogTitle>
            <DialogDescription>
              Organize your financial thoughts, research, and plans
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input 
                value={noteForm.title}
                onChange={(e) => setNoteForm({...noteForm, title: e.target.value})}
                placeholder="Enter note title"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={noteForm.category} onValueChange={(val) => setNoteForm({...noteForm, category: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Budget">Budget</SelectItem>
                    <SelectItem value="Investment">Investment</SelectItem>
                    <SelectItem value="Liability">Liability</SelectItem>
                    <SelectItem value="Goal">Goal</SelectItem>
                    <SelectItem value="Tax">Tax</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Folder</label>
                <Input 
                  value={noteForm.folder}
                  onChange={(e) => setNoteForm({...noteForm, folder: e.target.value})}
                  placeholder="e.g., Finances/Budgeting"
                />
                <p className="text-xs text-muted-foreground">Use / to create subfolders</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Content</label>
                <span className="text-xs text-muted-foreground">Supports Markdown</span>
              </div>
              <div className="border rounded-md h-[400px] overflow-hidden">
                <MarkdownEditor
                  value={noteForm.content}
                  onChange={({ text }) => setNoteForm({...noteForm, content: text})}
                  renderHTML={(text) => (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]} 
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {text}
                    </ReactMarkdown>
                  )}
                  className="h-full"
                  view={{ menu: true, md: true, html: false }}
                  canView={{ menu: true, md: true, html: false, fullScreen: false, hideMenu: true }}
                  style={{ height: '100%' }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use markdown for rich formatting - headings (#), lists (- item), bold (**text**), links ([text](url)), code (```code```)
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Input 
                value={noteForm.tags}
                onChange={(e) => setNoteForm({...noteForm, tags: e.target.value})}
                placeholder="Comma-separated tags (e.g., budget, planning, research)"
              />
              <p className="text-xs text-muted-foreground">Separate tags with commas</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote}>
              {editingNoteId !== null ? "Update Note" : "Create Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {viewMode === 'list' ? (
        <div className="grid grid-cols-12 gap-6">
          {/* Folder sidebar */}
          <div className="col-span-12 md:col-span-3">
            <Card className="h-full p-4">
              <FolderTreeView />
            </Card>
          </div>
          
          {/* Note content */}
          <div className="col-span-12 md:col-span-9">
            <NoteDetailView />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6 border-b">
                    <Skeleton className="h-6 w-2/3 mb-2" />
                    <div className="flex gap-2 mb-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            filteredNotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map(note => (
                  <Card 
                    key={note.id} 
                    className={`overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary/10 transition-all ${
                      note.isPinned ? 'ring-2 ring-yellow-200 dark:ring-yellow-800' : ''
                    }`}
                    onClick={() => handleSelectNote(note)}
                  >
                    <CardContent className="p-0">
                      <div className="p-6 border-b">
                        <div className="flex justify-between mb-2">
                          <h3 className="font-semibold text-lg">{note.title}</h3>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {note.isPinned && (
                              <Star className="h-4 w-4 text-yellow-500" />
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditNote(note);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNote(note.id);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className={`text-xs ${getCategoryColor(note.category)}`}>
                            {note.category}
                          </Badge>
                          {note.folder && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <FolderTree className="h-3 w-3" />
                              {note.folder}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(note.recordDate.toString())}
                          </Badge>
                        </div>

                        <p className="text-sm text-neutral-700 whitespace-pre-line mb-3 line-clamp-3">
                          {note.content}
                        </p>

                        {note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                            {note.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{note.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <Card className="max-w-md w-full p-8 text-center shadow-lg border-dashed">
                  <div className="flex flex-col items-center">
                    {searchTerm || filterCategory ? (
                      <>
                        <Search className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-xl font-medium mb-2">No matching notes found</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                          Try changing your search terms or filter criteria to find what you're looking for
                        </p>
                        <div className="flex gap-4">
                          <Button variant="outline" onClick={() => {
                            setSearchTerm('');
                            setFilterCategory(null);
                            setFilterFolder(null);
                          }}>
                            Clear Filters
                          </Button>
                          <Button onClick={handleAddNote}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Note
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <FileText className="h-20 w-20 text-primary/20 mb-6" />
                        <h3 className="text-xl font-medium mb-2">No notes yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                          Create your first note to start organizing your financial thoughts, research, and plans
                        </p>
                        <Button size="lg" onClick={handleAddNote}>
                          <Plus className="h-5 w-5 mr-2" />
                          Create Your First Note
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}