"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, ExternalLink, Pencil, QrCode, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { urlsApi } from "@/lib/api";
import type { UrlItem } from "@/types";

export default function LinksPage() {
  const [links, setLinks] = useState<UrlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLink, setEditLink] = useState<UrlItem | null>(null);
  const [editActive, setEditActive] = useState(true);
  const [editExpiry, setEditExpiry] = useState("");
  const [deleteLink, setDeleteLink] = useState<UrlItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLinks = () => {
    urlsApi.list()
      .then((res) => setLinks(res.data.content || []))
      .catch(() => toast.error("Failed to load links"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLinks(); }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const handleDelete = async () => {
    if (!deleteLink) return;
    setDeleting(true);
    try {
      await urlsApi.delete(deleteLink.id);
      toast.success("Link deleted");
      setDeleteLink(null);
      fetchLinks();
    } catch {
      toast.error("Failed to delete link");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editLink) return;
    try {
      await urlsApi.update(editLink.id, {
        active: editActive,
        expiresAt: editExpiry ? new Date(editExpiry).toISOString() : null,
      });
      toast.success("Link updated");
      setEditLink(null);
      fetchLinks();
    } catch {
      toast.error("Failed to update link");
    }
  };

  const openEdit = (link: UrlItem) => {
    setEditLink(link);
    setEditActive(link.active);
    setEditExpiry(link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : "");
  };

  if (loading) return <div className="flex h-64 items-center justify-center">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Links</h1>
          <p className="text-zinc-500">Manage all your shortened URLs</p>
        </div>
        <Button asChild>
          <Link href="/shorten">Create New</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Links ({links.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="py-12 text-center text-zinc-500">No links yet. <Link href="/shorten" className="underline">Create one</Link></p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                    <th className="pb-3 font-medium">Short Code</th>
                    <th className="pb-3 font-medium">Long URL</th>
                    <th className="pb-3 font-medium">Clicks</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Expires</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id} className="border-b border-zinc-100 dark:border-zinc-900">
                      <td className="py-3 font-mono">/{link.shortCode}</td>
                      <td className="max-w-xs truncate py-3 text-zinc-500">{link.longUrl}</td>
                      <td className="py-3">{link.clickCount}</td>
                      <td className="py-3">
                        <Badge variant={link.active ? "default" : "secondary"}>
                          {link.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 text-zinc-500">
                        {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : "Never"}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => copyToClipboard(link.shortUrl)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <QrCode className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>QR Code</DialogTitle></DialogHeader>
                              <div className="flex justify-center p-4">
                                <QRCodeSVG value={link.shortUrl} size={256} />
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(link)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" asChild>
                            <Link href={`/links/${link.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteLink(link)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editLink} onOpenChange={(open) => !open && setEditLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Link /{editLink?.shortCode}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
              <Label htmlFor="active">Active</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editExpiry">Expiry Date</Label>
              <Input id="editExpiry" type="datetime-local" value={editExpiry} onChange={(e) => setEditExpiry(e.target.value)} />
            </div>
            <Button onClick={handleUpdate} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteLink} onOpenChange={(open) => !open && !deleting && setDeleteLink(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete the short link <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">/{deleteLink?.shortCode}</span>?
            </p>
            {deleteLink?.longUrl && (
              <div className="rounded-md bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                <span className="font-semibold block mb-1">Target URL:</span>
                <span className="break-all font-mono">{deleteLink.longUrl}</span>
              </div>
            )}
            <p className="text-xs text-red-500 dark:text-red-400">
              This action cannot be undone and all associated analytics data will be lost.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteLink(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
