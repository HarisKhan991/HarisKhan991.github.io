"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Users, BookOpen, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Class {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  icon?: string;
  inviteCode: string;
  owner: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  _count: {
    members: number;
    posts: number;
    assignments: number;
  };
  members: Array<{ role: string }>;
}

export default function ClassesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  const [newClass, setNewClass] = useState({
    name: "",
    description: "",
  });

  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchClasses();
    } else if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      } else {
        toast.error("Failed to load classes");
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClass),
      });

      if (response.ok) {
        const createdClass = await response.json();
        setClasses([createdClass, ...classes]);
        setCreateDialogOpen(false);
        setNewClass({ name: "", description: "" });
        toast.success("Class created successfully!");
      } else {
        const error = await response.text();
        toast.error(error || "Failed to create class");
      }
    } catch (error) {
      console.error("Error creating class:", error);
      toast.error("Failed to create class");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinLoading(true);

    try {
      const response = await fetch(`/api/classes/join/${joinCode}`, {
        method: "POST",
      });

      if (response.ok) {
        const joinedClass = await response.json();
        setClasses([joinedClass, ...classes]);
        setJoinDialogOpen(false);
        setJoinCode("");
        toast.success("Joined class successfully!");
      } else {
        const error = await response.text();
        toast.error(error || "Failed to join class");
      }
    } catch (error) {
      console.error("Error joining class:", error);
      toast.error("Failed to join class");
    } finally {
      setJoinLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Classes</h1>
          <p className="text-gray-600">Manage your classes and assignments</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Join Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleJoinClass}>
                <DialogHeader>
                  <DialogTitle>Join a Class</DialogTitle>
                  <DialogDescription>
                    Enter the invite code provided by your teacher
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="joinCode">Invite Code</Label>
                  <Input
                    id="joinCode"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter invite code"
                    required
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={joinLoading}>
                    {joinLoading ? "Joining..." : "Join Class"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateClass}>
                <DialogHeader>
                  <DialogTitle>Create New Class</DialogTitle>
                  <DialogDescription>
                    Create a new class and invite students to join
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Class Name</Label>
                    <Input
                      id="name"
                      value={newClass.name}
                      onChange={(e) =>
                        setNewClass({ ...newClass, name: e.target.value })
                      }
                      placeholder="e.g., Mathematics 101"
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newClass.description}
                      onChange={(e) =>
                        setNewClass({ ...newClass, description: e.target.value })
                      }
                      placeholder="Describe what this class is about..."
                      className="mt-2"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? "Creating..." : "Create Class"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {classes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No classes yet</h3>
            <p className="text-gray-600 mb-4">
              Create a new class or join an existing one to get started
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setJoinDialogOpen(true)} variant="outline">
                Join Class
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                Create Class
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classRoom) => {
            const userRole = classRoom.members[0]?.role || "member";
            const isTeacherOrAdmin = ["teacher", "admin"].includes(userRole);

            return (
              <Card
                key={classRoom.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/classes/${classRoom.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">
                        {classRoom.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {classRoom.description || "No description"}
                      </CardDescription>
                    </div>
                    {classRoom.icon && (
                      <div className="text-3xl">{classRoom.icon}</div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Instructor:</span>
                      <span className="font-medium">{classRoom.owner.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Your Role:</span>
                      <span className="font-medium capitalize">{userRole}</span>
                    </div>
                    <div className="flex gap-4 mt-4 pt-4 border-t">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{classRoom._count.members}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4 text-gray-500" />
                        <span>{classRoom._count.assignments}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{classRoom._count.posts}</span>
                      </div>
                    </div>
                    {isTeacherOrAdmin && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500">Invite Code:</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {classRoom.inviteCode}
                        </code>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
