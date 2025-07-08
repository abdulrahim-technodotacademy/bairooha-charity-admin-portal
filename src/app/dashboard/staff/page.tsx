
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { staff as initialStaff, Staff, Permissions } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";

const defaultPermissions: Permissions = {
  dashboard: true,
  projects: false,
  emergency: false,
  payments: false,
  donors: false,
  staff: false,
};

const initialFormData = {
  name: "",
  email: "",
  permissions: defaultPermissions,
  workingHours: { start: "09:00", end: "17:00" },
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    try {
      const storedStaff = sessionStorage.getItem("staff");
      setStaffList(storedStaff ? JSON.parse(storedStaff) : initialStaff);
    } catch (error) {
      console.error("Failed to parse staff from sessionStorage", error);
      setStaffList(initialStaff);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      sessionStorage.setItem("staff", JSON.stringify(staffList));
    }
  }, [staffList, isLoading]);

  useEffect(() => {
    if (isDialogOpen) {
      if (editingStaff) {
        setFormData({
          name: editingStaff.name,
          email: editingStaff.email,
          permissions: { ...defaultPermissions, ...editingStaff.permissions },
          workingHours: { ...editingStaff.workingHours },
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [editingStaff, isDialogOpen]);

  const handleOpenDialog = (staffMember: Staff | null = null) => {
    setEditingStaff(staffMember);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStaff(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleWorkingHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [id]: value,
      },
    }));
  };

  const handlePermissionChange = (permission: keyof Permissions, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [permission]: checked },
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const role = Object.values(formData.permissions).every(Boolean) ? 'Admin' : 'Staff';

    if (editingStaff) {
      setStaffList(
        staffList.map((member) =>
          member.id === editingStaff.id
            ? { ...member, ...formData, role }
            : member
        )
      );
    } else {
      const newStaffMember: Staff = {
        id: `staff-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        avatar: 'https://placehold.co/100x100.png',
        permissions: formData.permissions,
        workingHours: formData.workingHours,
        role,
      };
      setStaffList([newStaffMember, ...staffList]);
    }
    handleCloseDialog();
  };

  const permissionKeys = Object.keys(defaultPermissions) as Array<keyof Permissions>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            View, add, and manage staff members and their access control.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingStaff ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
              <DialogDescription>
                Assign permissions and working hours to control access levels.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" placeholder="John Doe" value={formData.name} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" type="email" placeholder="john.doe@example.com" value={formData.email} onChange={handleInputChange} className="col-span-3" required />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Hours
                </Label>
                <div className="col-span-3 grid grid-cols-2 gap-2">
                  <Input id="start" type="time" value={formData.workingHours.start} onChange={handleWorkingHoursChange} required />
                  <Input id="end" type="time" value={formData.workingHours.end} onChange={handleWorkingHoursChange} required />
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  Permissions
                </Label>
                <div className="col-span-3 grid grid-cols-2 gap-x-4 gap-y-2">
                  {permissionKeys.map((key) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={formData.permissions[key]}
                        onCheckedChange={(checked) => handlePermissionChange(key, !!checked)}
                      />
                      <Label htmlFor={key} className="font-normal capitalize">{key}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleCloseDialog}>Cancel</Button>
                <Button type="submit">{editingStaff ? 'Save Changes' : 'Add Staff'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Staff</CardTitle>
          <CardDescription>
            A list of all staff members in your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Working Hours</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right"><Skeleton className="h-9 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : (
                staffList.map((member: Staff) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Image
                          src={member.avatar}
                          alt={member.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                          data-ai-hint="person"
                        />
                        {member.name}
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {member.workingHours.start} - {member.workingHours.end}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(member.permissions)
                          .filter(([, hasAccess]) => hasAccess)
                          .map(([perm]) => (
                            <Badge key={perm} variant="secondary" className="capitalize">
                              {perm}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(member)}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
