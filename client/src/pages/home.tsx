import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type Task } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Bot, Plus, Sparkles } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const [analyzeText, setAnalyzeText] = useState("");

  const form = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      completed: false,
    },
  });

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const createTask = useMutation({
    mutationFn: async (data: { title: string; completed: boolean }) => {
      await apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      form.reset();
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Task>;
    }) => {
      await apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const getSuggestions = useMutation({
    mutationFn: async (task: string) => {
      const res = await apiRequest("POST", "/api/suggestions", { task });
      const data = await res.json();
      return data.suggestions as string[];
    },
    onSuccess: (suggestions) => {
      if (suggestions.length === 0) {
        toast({
          title: "No suggestions available",
          description: "The AI service is currently unavailable. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      suggestions.forEach((suggestion) => {
        createTask.mutate({ title: suggestion, completed: false });
      });
    },
  });

  const pendingTasks = tasks?.filter(task => !task.completed) || [];
  const completedTasks = tasks?.filter(task => task.completed) || [];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-purple-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-purple-800">Task Manager</h1>
          <p className="text-purple-600">
            {completedTasks.length} completed, {pendingTasks.length} pending
          </p>
        </div>

        <div className="space-y-8">
          {/* New Task Input */}
          <Card className="border-2 border-purple-100 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => createTask.mutate(data))}
                  className="flex gap-3"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input 
                            placeholder="Add a new task..." 
                            className="bg-white border-2 border-purple-100 focus:border-purple-300"
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    disabled={createTask.isPending}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-purple-700">Pending Tasks</h2>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow border-purple-100">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) =>
                        updateTask.mutate({
                          id: task.id,
                          data: { completed: !!checked },
                        })
                      }
                      className="border-2 border-purple-200"
                    />
                    <span className="text-purple-900">{task.title}</span>
                    <span className="text-xs text-purple-400 ml-auto">
                      Created {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Completed Tasks */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-purple-700">Completed Tasks</h2>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow bg-purple-50/50 border-purple-100">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) =>
                        updateTask.mutate({
                          id: task.id,
                          data: { completed: !!checked },
                        })
                      }
                      className="border-2 border-purple-200"
                    />
                    <span className="line-through text-purple-400">{task.title}</span>
                    <span className="text-xs text-purple-300 ml-auto">
                      Created {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* AI Assistant */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bot className="h-6 w-6 text-purple-500" />
                <h2 className="text-xl font-semibold text-purple-800">AI Assistant</h2>
              </div>
              <p className="text-sm text-purple-600 mb-4">
                Get task suggestions and analyze your tasks with AI
              </p>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter a task to analyze..."
                  value={analyzeText}
                  onChange={(e) => setAnalyzeText(e.target.value)}
                  className="bg-white border-2 border-purple-200 focus:border-purple-300"
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!analyzeText) {
                      toast({
                        title: "Enter a task first",
                        description: "Please enter a task before requesting suggestions.",
                        variant: "destructive",
                      });
                      return;
                    }
                    getSuggestions.mutate(analyzeText);
                  }}
                  disabled={getSuggestions.isPending}
                  className="bg-white hover:bg-purple-100 border-2 border-purple-200"
                >
                  {getSuggestions.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}