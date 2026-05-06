import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ApiHealthNoticeProps = {
  status: "online" | "offline";
  message: string;
};

export function ApiHealthNotice({ status, message }: ApiHealthNoticeProps) {
  if (status === "online") {
    return (
      <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>API online</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>API offline</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
