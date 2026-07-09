"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Copy, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { urlsApi } from "@/lib/api";
import type { UrlItem } from "@/types";

const schema = z.object({
  longUrl: z.string().regex(/^https?:\/\/.+/, "URL must start with http:// or https://"),
  customAlias: z.string().regex(/^[a-zA-Z0-9_-]*$/, "Only letters, numbers, underscore, hyphen").optional().or(z.literal("")),
  expiresAt: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ShortenPage() {
  const [result, setResult] = useState<UrlItem | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload: { longUrl: string; customAlias?: string; expiresAt?: string } = {
        longUrl: data.longUrl,
      };
      const alias = data.customAlias?.trim();
      if (alias) payload.customAlias = alias;
      if (data.expiresAt) payload.expiresAt = new Date(data.expiresAt).toISOString();

      const res = await urlsApi.create(payload);
      setResult(res.data);
      toast.success("Short link created!");
      reset();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to create short link");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Shorten URL</h1>
        <p className="text-zinc-500">Create a new short link with optional custom alias and expiry</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Short Link</CardTitle>
          <CardDescription>Paste your long URL below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="longUrl">Long URL</Label>
              <Input id="longUrl" placeholder="https://example.com/very-long-url" {...register("longUrl")} />
              {errors.longUrl && <p className="text-sm text-red-500">{errors.longUrl.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customAlias">Custom Alias (optional)</Label>
              <Input id="customAlias" placeholder="Leave empty for random code (e.g. aB3xY9z)" {...register("customAlias")} />
              {errors.customAlias && <p className="text-sm text-red-500">{errors.customAlias.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiry Date (optional)</Label>
              <Input id="expiresAt" type="datetime-local" {...register("expiresAt")} />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating..." : "Create Short Link"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardHeader>
            <CardTitle>Your Short Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input readOnly value={result.shortUrl} className="font-mono" />
              <Button size="icon" variant="outline" onClick={() => copyToClipboard(result.shortUrl)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" variant="outline">
                    <QrCode className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>QR Code</DialogTitle>
                  </DialogHeader>
                  <div className="flex justify-center p-4">
                    <QRCodeSVG value={result.shortUrl} size={256} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-zinc-500">
              Short code: <span className="font-mono font-medium">{result.shortCode}</span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
