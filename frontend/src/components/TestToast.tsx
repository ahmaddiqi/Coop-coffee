import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function TestToast() {
  const { toast } = useToast();

  const showSuccessToast = () => {
    toast({
      title: "Success Test",
      description: "This is a success toast notification",
      variant: "default",
    });
  };

  const showErrorToast = () => {
    toast({
      title: "Error Test",
      description: "This is an error toast notification",
      variant: "destructive",
    });
  };

  return (
    <div className="flex gap-4 p-4">
      <Button onClick={showSuccessToast}>Test Success Toast</Button>
      <Button onClick={showErrorToast} variant="destructive">Test Error Toast</Button>
    </div>
  );
}