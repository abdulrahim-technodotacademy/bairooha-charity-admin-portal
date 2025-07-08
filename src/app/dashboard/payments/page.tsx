"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { IndianRupee, PlusCircle, Paperclip, MessageSquare, Receipt as ReceiptIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { payments as initialPayments, Payment, Project, Debit, debits as initialDebits, projects as initialProjects } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Receipt } from '@/components/receipt';


type Transaction = (Payment & { transactionType: 'credit' }) | (Debit & { transactionType: 'debit' });

const initialFormData = {
  projectId: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  // Credit specific
  donorName: '',
  mode: 'Manual' as const,
  // Debit specific
  description: '',
  // Common
  reason: '',
  // Attachment
  attachmentName: '',
  attachmentUri: '',
};

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for data, managed with sessionStorage
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [debits, setDebits] = useState<Debit[]>(initialDebits);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // State for the "Add Transaction" dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTransactionType, setNewTransactionType] = useState<'credit' | 'debit'>('credit');
  const [formData, setFormData] = useState(initialFormData);
  const [viewAttachmentUri, setViewAttachmentUri] = useState<string | null>(null);
  const [viewReason, setViewReason] = useState<string | null>(null);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);

  useEffect(() => {
    const storedProjectsJSON = sessionStorage.getItem("projects");
    setProjects(storedProjectsJSON ? JSON.parse(storedProjectsJSON) : initialProjects);
    
    const storedPaymentsJSON = sessionStorage.getItem('payments');
    setPayments(storedPaymentsJSON ? JSON.parse(storedPaymentsJSON) : initialPayments);
    
    const storedDebitsJSON = sessionStorage.getItem('debits');
    setDebits(storedDebitsJSON ? JSON.parse(storedDebitsJSON) : initialDebits);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    sessionStorage.setItem('payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    sessionStorage.setItem('debits', JSON.stringify(debits));
  }, [debits]);

  useEffect(() => {
    const allPayments = payments.map(p => ({ ...p, transactionType: 'credit' as const, projectName: projects.find(proj => proj.id === p.projectId)?.name || p.projectName }));
    const allDebits = debits.map(d => ({ ...d, transactionType: 'debit' as const, projectName: projects.find(proj => proj.id === d.projectId)?.name || d.projectName }));
    
    const combined: Transaction[] = [...allPayments, ...allDebits];
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(combined);
  }, [payments, debits, projects]);

  const { totalCredit, totalDebit } = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        if (tx.transactionType === 'credit' && tx.mode !== 'Refund') {
          acc.totalCredit += tx.amount;
        } else if (tx.transactionType === 'debit') {
          acc.totalDebit += tx.amount;
        }
        return acc;
      },
      { totalCredit: 0, totalDebit: 0 }
    );
  }, [transactions]);
  
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;

    return transactions.filter(tx => {
      const term = searchTerm.toLowerCase();
      if (tx.transactionType === 'credit') {
        return tx.donorName.toLowerCase().includes(term) || 
               tx.projectName.toLowerCase().includes(term) ||
               tx.mode.toLowerCase().includes(term);
      } else { // debit
        return tx.description.toLowerCase().includes(term) || tx.projectName.toLowerCase().includes(term);
      }
    });
  }, [searchTerm, transactions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData({ ...formData, [id]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          attachmentUri: reader.result as string,
          attachmentName: file.name
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, attachmentUri: '', attachmentName: '' }));
    }
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProject = projects.find(p => p.id === formData.projectId);
    if (!selectedProject) return;

    const amount = parseFloat(formData.amount) || 0;

    if (newTransactionType === 'credit') {
      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        donorName: formData.donorName,
        amount: amount,
        date: formData.date,
        projectId: formData.projectId,
        projectName: selectedProject.name,
        mode: formData.mode,
        reason: formData.reason || undefined,
        attachmentName: formData.attachmentName,
        attachmentUri: formData.attachmentUri,
      };
      setPayments(prev => [newPayment, ...prev]);

      if (formData.mode !== 'Refund') {
        const updatedProjects = projects.map(p =>
          p.id === formData.projectId
            ? { ...p, raised: p.raised + amount }
            : p
        );
        setProjects(updatedProjects);
      }

    } else {
      const newDebit: Debit = {
        id: `debit-${Date.now()}`,
        description: formData.description,
        amount: amount,
        date: formData.date,
        projectId: formData.projectId,
        projectName: selectedProject.name,
        reason: formData.reason || undefined,
        attachmentName: formData.attachmentName,
        attachmentUri: formData.attachmentUri,
      };
      setDebits(prev => [newDebit, ...prev]);
    }
    
    setIsAddDialogOpen(false);
    setFormData(initialFormData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
          <p className="text-muted-foreground">
            A detailed history of all payments and project expenses.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
            setIsAddDialogOpen(isOpen);
            if (!isOpen) {
                setFormData(initialFormData);
                setNewTransactionType('credit');
            }
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
              <DialogDescription>
                Manually record a new payment or expense.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <Label>Transaction Type</Label>
                <RadioGroup value={newTransactionType} className="flex items-center gap-4 pt-2" onValueChange={(value: 'credit' | 'debit') => setNewTransactionType(value)}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="credit" id="r1" />
                        <Label htmlFor="r1">Credit (Income)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="debit" id="r2" />
                        <Label htmlFor="r2">Debit (Expense)</Label>
                    </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectId">Project</Label>
                  <Select name="projectId" onValueChange={(value) => handleSelectChange('projectId', value)} required>
                      <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                      <SelectContent>
                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input id="amount" type="number" value={formData.amount} onChange={handleInputChange} placeholder="100.00" required />
                </div>
              </div>

              {newTransactionType === 'credit' ? (
                <>
                  <div>
                    <Label htmlFor="donorName">Source / Donor Name</Label>
                    <Input id="donorName" value={formData.donorName} onChange={handleInputChange} placeholder="e.g., Jane Doe or Grant Corp" required />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Textarea id="reason" value={formData.reason} onChange={handleInputChange} placeholder="e.g., In memory of a loved one, for annual gala, etc."/>
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" type="date" value={formData.date} onChange={handleInputChange} required />
                     </div>
                     <div>
                        <Label htmlFor="mode">Mode</Label>
                        <Select name="mode" defaultValue="Manual" onValueChange={(value) => handleSelectChange('mode', value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Online">Online</SelectItem>
                            <SelectItem value="Wallet">Wallet</SelectItem>
                            <SelectItem value="Manual">Manual</SelectItem>
                            <SelectItem value="Refund">Refund</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" value={formData.description} onChange={handleInputChange} placeholder="e.g., Office Supplies" required />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Textarea id="reason" value={formData.reason} onChange={handleInputChange} placeholder="e.g., Justification for the expense"/>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={formData.date} onChange={handleInputChange} required />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="attachment">Attachment (Optional)</Label>
                <Input id="attachment" type="file" onChange={handleFileChange} />
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Transaction</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credit</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-credit">₹{totalCredit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">from all donations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debit</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-debit">₹{totalDebit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">for project expenses</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            A complete record of every transaction, including donations and debits.
          </CardDescription>
          <div className="mt-4">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDate(tx.date)}</TableCell>
                    <TableCell className="font-medium">{tx.projectName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tx.transactionType === 'credit' ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{tx.donorName}</span>
                            {tx.reason && (
                               <Button variant="ghost" size="icon" className="h-auto w-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => setViewReason(tx.reason)}>
                                   <MessageSquare className="h-4 w-4" />
                                   <span className="sr-only">View Reason</span>
                               </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{tx.description}</span>
                             {tx.reason && (
                               <Button variant="ghost" size="icon" className="h-auto w-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => setViewReason(tx.reason)}>
                                   <MessageSquare className="h-4 w-4" />
                                   <span className="sr-only">View Reason</span>
                               </Button>
                            )}
                          </div>
                        )}
                        {tx.attachmentUri && (
                           <Button variant="link" size="sm" className="h-auto p-0 text-sm" onClick={() => setViewAttachmentUri(tx.attachmentUri!)}>
                               <Paperclip className="mr-1 h-3 w-3" />
                               View Attachment
                           </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {tx.transactionType === 'credit' ? (
                        <Badge variant={tx.mode === 'Refund' ? 'destructive' : 'secondary'}>{tx.mode}</Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-credit">
                      {tx.transactionType === 'credit' && tx.mode !== 'Refund'
                        ? `₹${tx.amount.toLocaleString()}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-debit">
                      {tx.transactionType === 'debit' || (tx.transactionType === 'credit' && tx.mode === 'Refund')
                        ? `₹${tx.amount.toLocaleString()}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.transactionType === 'credit' && tx.mode !== 'Refund' && (
                        <Button variant="outline" size="icon" onClick={() => setSelectedPaymentForReceipt(tx)}>
                          <ReceiptIcon className="h-4 w-4" />
                          <span className="sr-only">Generate Receipt</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={!!viewAttachmentUri} onOpenChange={(isOpen) => !isOpen && setViewAttachmentUri(null)}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Attachment Viewer</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
                {viewAttachmentUri && <img src={viewAttachmentUri} alt="Attachment" className="w-full h-auto rounded-md object-contain max-h-[70vh]" />}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setViewAttachmentUri(null)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!viewReason} onOpenChange={(isOpen) => !isOpen && setViewReason(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Transaction Reason</DialogTitle>
            </DialogHeader>
            <p className="py-4 text-sm text-muted-foreground">{viewReason}</p>
            <DialogFooter>
                <Button variant="outline" onClick={() => setViewReason(null)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPaymentForReceipt} onOpenChange={(isOpen) => !isOpen && setSelectedPaymentForReceipt(null)}>
        <DialogContent className="max-w-3xl p-0 border-0 bg-transparent shadow-none">
            <div id="receipt-to-print">
              {selectedPaymentForReceipt && <Receipt payment={selectedPaymentForReceipt} />}
            </div>
            <DialogFooter className="p-4 bg-background no-print">
              <Button variant="ghost" onClick={() => setSelectedPaymentForReceipt(null)}>Close</Button>
              <Button onClick={() => window.print()}>Print Receipt</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    
