"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getAllMaps,
  createMap,
  setActiveMap,
  deleteMap,
  type OfflineMap,
} from "@/lib/api/maps";

import {
  MapPin,
  Image as ImageIcon,
  Globe2,
  Loader2,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Layers,
} from "lucide-react";

function mergeMaps(prev: OfflineMap[], next: OfflineMap[]) {
  const prevById = new Map(prev.map((m) => [m.id, m]));

  return next.map((incoming) => ({
    ...prevById.get(incoming.id),
    ...incoming,
  }));
}

function shallowEqualMaps(a: OfflineMap[], b: OfflineMap[]) {
  if (a.length !== b.length) return false;
  return a.every((m, i) => m === b[i]);
}

export default function ManageMapsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [maps, setMaps] = useState<OfflineMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // form state for new map
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [minZoom, setMinZoom] = useState("13");
  const [maxZoom, setMaxZoom] = useState("18");
  const [north, setNorth] = useState<string>("");
  const [south, setSouth] = useState<string>("");
  const [east, setEast] = useState<string>("");
  const [west, setWest] = useState<string>("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  const { toast } = useToast();
  const router = useRouter();

  // =============================
  // Fetch maps
  // =============================
  const loadMaps = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true); // ONLY initial/manual load
    }

    setError(null);

    try {
      const res = await getAllMaps();

      if (res.success && res.data) {
        setMaps((prev) => {
          const merged = mergeMaps(prev, res.data);
          return shallowEqualMaps(prev, merged) ? prev : merged;
        });
      } else {
        setError(res.error || "Failed to fetch maps");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch maps");
    } finally {
      if (!opts?.silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadMaps();
  }, []);

  useEffect(() => {
    const hasDownloading = maps.some((m) => m.downloadStatus === "DOWNLOADING");

    // START polling
    if (hasDownloading && !pollingRef.current) {
      pollingRef.current = setInterval(() => {
        // 🛑 prevent overlapping requests
        if (isFetchingRef.current) return;

        isFetchingRef.current = true;

        loadMaps({ silent: true }).finally(() => {
          isFetchingRef.current = false;
        });
      }, 2000);
    }

    // STOP polling
    if (!hasDownloading && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [maps]);

  const activeMapId = maps.find((m) => m.isActive)?.id || null;

  // =============================
  // Validate and submit new map
  // =============================
  const handleCreateMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // basic validation
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the map.",
        variant: "destructive",
      });
      return;
    }

    const northNum = Number(north);
    const southNum = Number(south);
    const eastNum = Number(east);
    const westNum = Number(west);
    const minZoomNum = Number(minZoom);
    const maxZoomNum = Number(maxZoom);

    if ([northNum, southNum, eastNum, westNum].some((v) => Number.isNaN(v))) {
      toast({
        title: "Invalid bounds",
        description: "North, south, east, west must all be valid numbers.",
        variant: "destructive",
      });
      return;
    }

    if (northNum <= southNum) {
      toast({
        title: "Invalid latitude bounds",
        description: "North must be greater than South.",
        variant: "destructive",
      });
      return;
    }

    if (eastNum <= westNum) {
      toast({
        title: "Invalid longitude bounds",
        description: "East must be greater than West.",
        variant: "destructive",
      });
      return;
    }

    if (Number.isNaN(minZoomNum) || Number.isNaN(maxZoomNum)) {
      toast({
        title: "Invalid zoom levels",
        description: "Min and max zoom must be valid numbers.",
        variant: "destructive",
      });
      return;
    }

    if (minZoomNum > maxZoomNum) {
      toast({
        title: "Invalid zoom levels",
        description: "Min zoom must be less than or equal to max zoom.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        north: northNum,
        south: southNum,
        east: eastNum,
        west: westNum,
        minZoom: minZoomNum,
        maxZoom: maxZoomNum,
      };

      const res = await createMap(payload);

      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to create map");
      }

      toast({
        title: "Map created",
        description: `Map "${res.data.name}" created successfully.`,
      });

      // reset form
      setName("");
      setDescription("");
      setNorth("");
      setSouth("");
      setEast("");
      setWest("");
      setMinZoom("13");
      setMaxZoom("18");

      // reload list
      await loadMaps({ silent: true });
    } catch (err: any) {
      console.error("Error creating map:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to create map",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // =============================
  // Set active map
  // =============================
  const handleSetActive = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await setActiveMap(id);
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to set active map");
      }

      toast({
        title: "Active map changed",
        description: `"${res.data.name}" is now the active map.`,
      });

      await loadMaps({ silent: true });
    } catch (err: any) {
      console.error("Error setting active map:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to set active map",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // =============================
  // Delete map
  // =============================
  const handleDelete = async (id: string, name: string, isActive: boolean) => {
    if (isActive) {
      toast({
        title: "Cannot delete active map",
        description: "Set another map as active before deleting this one.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Delete map "${name}"? This cannot be undone.`)) {
      return;
    }

    setActionLoadingId(id);
    try {
      const res = await deleteMap(id);
      if (!res.success) {
        throw new Error(res.error || "Failed to delete map");
      }

      toast({
        title: "Map deleted",
        description: `"${name}" has been removed.`,
      });

      await loadMaps({ silent: true });
    } catch (err: any) {
      console.error("Error deleting map:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to delete map",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // =============================
  // Render
  // =============================
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-[#4A9FD4]">
                Offline Maps
              </h1>
              <p className="text-sm text-gray-400">
                Manage offline map images & coordinate bounds used by the
                dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Layout: left list, right form */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          {/* Existing maps */}
          <section className="space-y-4">
            <Card className="border-[#333] bg-[#222]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <Globe2 className="h-5 w-5 text-[#4A9FD4]" />
                  Existing Maps
                </CardTitle>
                {loading && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin text-[#4A9FD4]" />
                    <span>Loading...</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {error && (
                  <div className="rounded border border-red-800 bg-red-900/40 p-3 text-xs text-red-200">
                    {error}
                  </div>
                )}

                {!loading && !error && maps.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No maps configured yet. Create one using the form on the
                    right.
                  </p>
                )}

                {!loading &&
                  !error &&
                  maps.map((map) => {
                    const isActive = map.isActive;
                    const loadingThis = actionLoadingId === map.id;
                    const isTiled = true;

                    return (
                      <div
                        key={map.id}
                        className="flex items-start justify-between gap-3 rounded-md border border-[#333] bg-[#1a1a1a] p-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">
                              {map.name}
                            </p>
                            {isActive && (
                              <Badge className="flex items-center gap-1 bg-green-600 text-[10px] text-white">
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 border-[#444] text-[10px] text-gray-400"
                            >
                              <Layers className="h-3 w-3" />
                              Satellite
                            </Badge>
                          </div>
                          {map.description && (
                            <p className="text-xs text-gray-400">
                              {map.description}
                            </p>
                          )}
                          <div className="mt-1 grid gap-1 text-[11px] text-gray-400 sm:grid-cols-2">
                            <div className="flex items-center gap-1">
                              {isTiled ? (
                                <Layers className="h-3 w-3 text-gray-500" />
                              ) : (
                                <ImageIcon className="h-3 w-3 text-gray-500" />
                              )}
                              <span className="truncate">Stored locally</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-500" />
                              <span>
                                N {map.north.toFixed(4)} / S{" "}
                                {map.south.toFixed(4)} • E {map.east.toFixed(4)}{" "}
                                / W {map.west.toFixed(4)}
                              </span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Zoom: {map.minZoom} - {map.maxZoom}
                          </div>
                          {map.downloadStatus === "DOWNLOADING" && (
                            <div className="text-xs text-blue-400">
                              Downloading… {map.downloadProgress}%
                            </div>
                          )}

                          {map.downloadStatus === "READY" && (
                            <div className="text-xs text-green-400">Ready</div>
                          )}

                          {map.downloadStatus === "FAILED" && (
                            <div className="text-xs text-red-400">
                              Failed{" "}
                              {map.downloadError && `– ${map.downloadError}`}
                            </div>
                          )}

                          <p className="text-[10px] text-gray-500">
                            Created: {new Date(map.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2">
                          {!isActive && (
                            <Button
                              size="sm"
                              className="bg-[#2563EB] text-[11px] text-white hover:bg-[#1D4ED8]"
                              disabled={
                                loadingThis || map.downloadStatus !== "READY"
                              }
                              onClick={() => handleSetActive(map.id)}
                            >
                              {loadingThis ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                              )}
                              Set Active
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-700 text-[11px] text-red-400 hover:bg-red-900/40"
                            disabled={loadingThis}
                            onClick={() =>
                              handleDelete(map.id, map.name, isActive)
                            }
                          >
                            {loadingThis ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="mr-1 h-3 w-3" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </section>

          {/* New map form */}
          <section>
            <Card className="border-[#333] bg-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <MapPin className="h-5 w-5 text-[#4A9FD4]" />
                  Add New Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateMap} className="space-y-4 text-sm">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs text-gray-300">
                      Map Name<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Campus North Sector"
                      className="h-9 border-[#444] bg-[#1a1a1a] text-xs text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="description"
                      className="text-xs text-gray-300"
                    >
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description"
                      className="h-9 border-[#444] bg-[#1a1a1a] text-xs text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="minZoom"
                        className="text-xs text-gray-300"
                      >
                        Min Zoom
                      </Label>
                      <Input
                        id="minZoom"
                        type="number"
                        value={minZoom}
                        onChange={(e) => setMinZoom(e.target.value)}
                        placeholder="13"
                        className="h-9 border-[#444] bg-[#1a1a1a] text-xs text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="maxZoom"
                        className="text-xs text-gray-300"
                      >
                        Max Zoom
                      </Label>
                      <Input
                        id="maxZoom"
                        type="number"
                        value={maxZoom}
                        onChange={(e) => setMaxZoom(e.target.value)}
                        placeholder="18"
                        className="h-9 border-[#444] bg-[#1a1a1a] text-xs text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="north" className="text-xs text-gray-300">
                        North (max lat)
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="north"
                        type="number"
                        step="any"
                        value={north}
                        onChange={(e) => setNorth(e.target.value)}
                        placeholder="e.g. 28.6000"
                        className="h-9 border-[#444] bg-[#1a1a1a] text-xs text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="south" className="text-xs text-gray-300">
                        South (min lat)
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="south"
                        type="number"
                        step="any"
                        value={south}
                        onChange={(e) => setSouth(e.target.value)}
                        placeholder="e.g. 28.5500"
                        className="h-9 border-[#444] bg-[#1a1a1a] text-xs text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="east" className="text-xs text-gray-300">
                        East (max lng)
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="east"
                        type="number"
                        step="any"
                        value={east}
                        onChange={(e) => setEast(e.target.value)}
                        placeholder="e.g. 77.2000"
                        className="h-9 border-[#444] bg-[#1a1a1a] text-xs text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="west" className="text-xs text-gray-300">
                        West (min lng)
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="west"
                        type="number"
                        step="any"
                        value={west}
                        onChange={(e) => setWest(e.target.value)}
                        placeholder="e.g. 77.1000"
                        className="h-9 border-[#444] bg-[#1a1a1a] text-xs text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#2563EB] text-xs text-white hover:bg-[#1D4ED8] disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Map"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
