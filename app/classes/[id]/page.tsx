"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Plus, Users, BookOpen, Calendar, Copy, Check, UserPlus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  points?: number;
  isPublished: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string;
  };
  _count: {
    submissions: number;
  };
  submissions?: Array<{
    id: string;
    status: string;
    submittedAt?: string;
    grade?: number;
  }>;
}

export default function ClassDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;

  const [classData, setClassData] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    dueDate: "",
    points: 100,
    isPublished: true,
  });

  useEffect(() => {
    if (status === "authenticated" && classId) {
      fetchClassData();
      fetchAssignments();
    } else if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, classId, router]);

  const fetchClassData = async () => {
    try {
      const response = await fetch("/api/classes");
      if (response.ok) {
        const classes = await response.json();
        const currentClass = classes.find((c: any) => c.id === classId);
        setClassData(currentClass);
      }
    } catch (error) {
      console.error("Error fetching class data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}/assignments`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const response = await fetch(`/api/classes/${classId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAssignment),
      });

      if (response.ok) {
        const createdAssignment = await response.json();
        setAssignments([createdAssignment, ...assignments]);
        setCreateDialogOpen(false);
        setNewAssignment({
          title: "",
          description: "",
          dueDate: "",
          points: 100,
          isPublished: true,
        });
        toast.success("Assignment created successfully!");
      } else {
        const error = await response.text();
        toast.error(error || "Failed to create assignment");
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("Failed to create assignment");
    } finally {
      setCreateLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (classData?.inviteCode) {
      navigator.clipboard.writeText(classData.inviteCode);
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading class...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Class not found</p>
          <Button onClick={() => router.push("/classes")} className="mt-4">
            Back to Classes
          </Button>
        </div>
      </div>
    );
  }

  const userRole = classData.members[0]?.role || "member";
  const isTeacherOrAdmin = ["teacher", "admin"].includes(userRole);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/classes")}
              className="mb-2"
            >
              ← Back to Classes
            </Button>
            <h1 className="text-4xl font-bold mb-2">{classData.name}</h1>
            <p className="text-gray-600">{classData.description}</p>
          </div>
          <div className="flex gap-2">
            {isTeacherOrAdmin && (
              <>
                <Button variant="outline" onClick={copyInviteCode}>
                  {copied ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Invite Code"}
                </Button>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span>{classData._count.members} members</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-500" />
            <span>{classData._count.assignments} assignments</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={userRole === "admin" ? "default" : userRole === "teacher" ? "secondary" : "outline"}>
              {userRole}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="stream" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="stream">Stream</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
        </TabsList>

        <TabsContent value="stream" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Class Stream</CardTitle>
              <CardDescription>
                Announcements and updates will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                No posts yet. Check back later for updates!
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Assignments</h2>
            {isTeacherOrAdmin && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <form onSubmit={handleCreateAssignment}>
                    <DialogHeader>
                      <DialogTitle>Create New Assignment</DialogTitle>
                      <DialogDescription>
                        Create a new assignment for your students
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={newAssignment.title}
                          onChange={(e) =>
                            setNewAssignment({ ...newAssignment, title: e.target.value })
                          }
                          placeholder="Assignment title"
                          required
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newAssignment.description}
                          onChange={(e) =>
                            setNewAssignment({
                              ...newAssignment,
                              description: e.target.value,
                            })
                          }
                          placeholder="Describe the assignment..."
                          className="mt-2"
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="dueDate">Due Date</Label>
                          <Input
                            id="dueDate"
                            type="datetime-local"
                            value={newAssignment.dueDate}
                            onChange={(e) =>
                              setNewAssignment({
                                ...newAssignment,
                                dueDate: e.target.value,
                              })
                            }
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="points">Points</Label>
                          <Input
                            id="points"
                            type="number"
                            value={newAssignment.points}
                            onChange={(e) =>
                              setNewAssignment({
                                ...newAssignment,
                                points: parseInt(e.target.value) || 0,
                              })
                            }
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createLoading}>
                        {createLoading ? "Creating..." : "Create Assignment"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {assignments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
                <p className="text-gray-600">
                  {isTeacherOrAdmin
                    ? "Create your first assignment to get started"
                    : "Your teacher hasn't posted any assignments yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const userSubmission = assignment.submissions?.[0];
                const isOverdue =
                  assignment.dueDate && new Date(assignment.dueDate) < new Date();

                return (
                  <Card
                    key={assignment.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/classes/${classId}/assignments/${assignment.id}`
                      )
                    }
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">
                            {assignment.title}
                          </CardTitle>
                          <CardDescription>
                            {assignment.description}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {assignment.points && (
                            <Badge variant="outline">{assignment.points} pts</Badge>
                          )}
                          {userSubmission && (
                            <Badge
                              variant={
                                userSubmission.status === "GRADED"
                                  ? "default"
                                  : userSubmission.status === "SUBMITTED"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {userSubmission.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex gap-4">
                          <span className="text-gray-600">
                            Posted by {assignment.creator.name}
                          </span>
                          {assignment.dueDate && (
                            <span
                              className={
                                isOverdue ? "text-red-600 font-medium" : "text-gray-600"
                              }
                            >
                              Due{" "}
                              {formatDistanceToNow(new Date(assignment.dueDate), {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                        {isTeacherOrAdmin && (
                          <span className="text-gray-600">
                            {assignment._count.submissions} submissions
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="people" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Class Members</CardTitle>
              <CardDescription>
                View and manage class members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                Member list coming soon!
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
