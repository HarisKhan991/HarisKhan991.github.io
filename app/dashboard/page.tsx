"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, BookOpen, Target, TrendingUp, Plus, ArrowRight, 
  Award, Users, FileText, BarChart3, Bell, Settings, 
  LogOut, Menu, X, Calendar, CheckCircle2, Zap, 
  Brain, GraduationCap, Activity, Star
} from 'lucide-react'
import { useSubjects, useTasks, useStudySessions, useTestMarks } from '@/hooks'
import { ProgressOverview } from '@/components/dashboard/progress-overview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { StudyHeatmap } from '@/components/dashboard/StudyHeatmap'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

// Custom hook for greeting
function useTimeOfDay() {
  const [timeOfDay, setTimeOfDay] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 17) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);

  return timeOfDay;
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const timeOfDay = useTimeOfDay()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Fetch data using hooks
  const { subjects = [], isLoading: subjectsLoading } = useSubjects()
  const { tasks = [], isLoading: tasksLoading } = useTasks()
  const { studySessions = [], isLoading: sessionsLoading } = useStudySessions()
  const { testMarks = [], isLoading: testMarksLoading } = useTestMarks()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  if (status === 'loading' || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Calculate statistics
  const totalSubjects = subjects.length || 0
  const totalTasks = tasks.length || 0
  const completedTasks = tasks.filter((t: any) => t.completed).length || 0
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  
  const totalStudyHours = studySessions.reduce((acc: number, session: any) => 
    acc + (session.duration || 0), 0) / 60 || 0
  
  const averageScore = testMarks.length > 0
    ? Math.round(testMarks.reduce((acc: number, mark: any) => 
        acc + ((mark.marksObtained / mark.totalMarks) * 100), 0) / testMarks.length)
    : 0

  const userName = session.user?.name?.split(' ')[0] || 'Student'

  // Stats data
  const stats = [
    {
      title: "Active Subjects",
      value: totalSubjects,
      change: "+2 this week",
      icon: BookOpen,
      gradient: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Study Hours",
      value: `${totalStudyHours.toFixed(1)}h`,
      change: "+5.2h this week",
      icon: Clock,
      gradient: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Task Progress",
      value: `${completionRate}%`,
      change: `${completedTasks}/${totalTasks} completed`,
      icon: CheckCircle2,
      gradient: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      iconColor: "text-green-600 dark:text-green-400"
    },
    {
      title: "Average Score",
      value: `${averageScore}%`,
      change: averageScore >= 80 ? "+5% improved" : "Keep studying!",
      icon: TrendingUp,
      gradient: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      iconColor: "text-orange-600 dark:text-orange-400"
    },
  ]

  const quickActionItems = [
    {
      title: "Start Study Session",
      description: "Begin focused learning",
      icon: Brain,
      href: "/study-sessions",
      color: "bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
    },
    {
      title: "Add Subject",
      description: "Manage your courses",
      icon: GraduationCap,
      href: "/subjects",
      color: "bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
    },
    {
      title: "View Analytics",
      description: "Track your progress",
      icon: BarChart3,
      href: "/analytics",
      color: "bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
    },
    {
      title: "Global Feed",
      description: "Connect with peers",
      icon: Users,
      href: "/feed",
      color: "bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
    },
  ]

  const upcomingTasks = tasks
    .filter((t: any) => !t.completed)
    .slice(0, 5)

  const recentSessions = studySessions
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white font-bold text-lg">
                S
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent hidden sm:block">
                StudyHi
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <Activity className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/subjects">
                <Button variant="ghost" size="sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Subjects
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="ghost" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <Link href="/feed">
                <Button variant="ghost" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Feed
                </Button>
              </Link>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
              >
                <LogOut className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t border-gray-200 dark:border-gray-800">
              <Link href="/dashboard" className="block">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                  <Activity className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/subjects" className="block">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Subjects
                </Button>
              </Link>
              <Link href="/analytics" className="block">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <Link href="/feed" className="block">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                  <Users className="w-4 h-4 mr-2" />
                  Feed
                </Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Good {timeOfDay}, {userName}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                Ready to achieve your learning goals today?
              </p>
            </div>
            <div className="hidden sm:flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                Level 5
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                7 day streak
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-gray-900"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`}></div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActionItems.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className={`${action.color} border-0 text-white hover:scale-105 transition-transform duration-300 cursor-pointer h-full`}>
                  <CardContent className="p-6">
                    <action.icon className="w-8 h-8 mb-3" />
                    <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                    <p className="text-sm text-white/80">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <ProgressOverview />

            {/* Study Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>Study Activity</CardTitle>
                <CardDescription>Your study pattern over time</CardDescription>
              </CardHeader>
              <CardContent>
                <StudyHeatmap sessions={studySessions} />
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Study Sessions</CardTitle>
                  <Link href="/study-sessions">
                    <Button variant="ghost" size="sm">
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentSessions.length > 0 ? (
                  <div className="space-y-4">
                    {recentSessions.map((session: any, index: number) => (
                      <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{session.subject || 'Study Session'}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.duration} minutes • {new Date(session.date).toLocaleDateString()}
                          </p>
                        </div>
                        {session.productivity && (
                          <Badge variant="secondary">
                            {session.productivity}/5 <Star className="w-3 h-3 ml-1" />
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No study sessions yet</p>
                    <Link href="/study-sessions">
                      <Button variant="link" size="sm" className="mt-2">
                        Start your first session
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <RecentActivity />

            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Upcoming Tasks</CardTitle>
                  <Link href="/tasks">
                    <Button variant="ghost" size="sm">
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingTasks.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingTasks.map((task: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>All tasks completed!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-0">
              <CardHeader>
                <CardTitle>Today's Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Study Time</span>
                      <span className="text-sm text-muted-foreground">2h / 4h</span>
                    </div>
                    <Progress value={50} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Tasks Completed</span>
                      <span className="text-sm text-muted-foreground">{completedTasks} / {totalTasks}</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>
                  <Button className="w-full mt-4" size="lg">
                    <Target className="w-4 h-4 mr-2" />
                    Set New Goals
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
