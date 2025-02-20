import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type Task } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Sparkles } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  const deleteTask = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully.",
      });
    },
  });

  const getSuggestions = useMutation({
    mutationFn: async (task: string) => {
      const res = await apiRequest("POST", "/api/suggestions", { task });
      const data = await res.json();
      return data.suggestions as string[];
    },
    onSuccess: (suggestions) => {
      setShowSuggestions(true);
      suggestions.forEach((suggestion) => {
        createTask.mutate({ title: suggestion, completed: false });
      });
    },
  });

  const onSubmit = (data: { title: string; completed: boolean }) => {
    createTask.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Task Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex gap-4 items-end"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Add a new task..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={createTask.isPending}
                className="w-24"
              >
                {createTask.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add"
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const taskText = form.getValues("title");
                  if (taskText) {
                    getSuggestions.mutate(taskText);
                  }
                }}
                disabled={getSuggestions.isPending}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Suggest
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {tasks?.map((task) => (
          <Card key={task.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) =>
                    updateTask.mutate({
                      id: task.id,
                      data: { completed: !!checked },
                    })
                  }
                />
                <span
                  className={`${
                    task.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteTask.mutate(task.id)}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}