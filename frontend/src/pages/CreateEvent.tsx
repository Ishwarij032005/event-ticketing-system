import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, DollarSign, Image, Type, AlignLeft, Clock, Users, Check, Loader2 } from "lucide-react";
import RippleButton from "@/components/RippleButton";
import AnimatedStatus from "@/components/AnimatedSuccess";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminEventsService } from "@/api";
import { APIResponse, CreateEventRequest } from "@/api/types";

interface CreateEventPayload {
  title: string;
  description: string;
  category: string;
  start_time: string;
  total_tickets: number;
  price: number;
}

interface EventFormState {
  title: string;
  category: string;
  description: string;
  startDate: string;
  startTime: string;
  total_tickets: string;
  price: string;
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState<EventFormState>({
    title: "",
    category: "Tech",
    description: "",
    startDate: "",
    startTime: "",
    total_tickets: "",
    price: "",
  });

  const set = (field: keyof EventFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.title.trim()) newErrors.title = true;
    if (!form.startDate) newErrors.startDate = true;
    if (!form.total_tickets || isNaN(Number(form.total_tickets))) newErrors.total_tickets = true;
    if (form.price === "" || isNaN(Number(form.price))) newErrors.price = true;
    setErrors(newErrors);
    setTimeout(() => setErrors({}), 3000);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (payload: CreateEventRequest) =>
      adminEventsService.create(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setSubmitted(true);
      toast.success("🎉 Event Published!", { description: "Your event is now live." });
      setTimeout(() => navigate(`/events/${res.data?.id ?? ""}`), 2000);
    },
    onError: (err: Error) => {
      toast.error("Failed to create event", { description: err.message });
    },
  });

  const draftMutation = useMutation({
    mutationFn: (payload: CreateEventRequest) =>
      adminEventsService.create({ ...payload, status: "draft" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("📝 Draft Saved", { description: "Your event has been saved as a draft." });
    },
    onError: (err: Error) => {
      toast.error("Failed to save draft", { description: err.message });
    },
  });

  const buildPayload = (imageUrl?: string): CreateEventRequest => ({
    title: form.title,
    description: form.description,
    category: form.category,
    start_time: form.startDate && form.startTime ? new Date(`${form.startDate}T${form.startTime}`).toISOString() : new Date(form.startDate).toISOString(),
    total_tickets: Number(form.total_tickets),
    price: Number(form.price),
    image_url: imageUrl,
  });

  const handlePublish = async () => {
    if (!validate()) return;

    let imageUrl = undefined;
    if (imageFile) {
      setUploadingImage(true);
      try {
        const uploadRes = await adminEventsService.uploadImage(imageFile);
        imageUrl = uploadRes.data?.url;
      } catch (err: any) {
        toast.error("Image upload failed", { description: err.message });
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    mutation.mutate(buildPayload(imageUrl));
  };

  const handleDraft = async () => {
    if (!form.title.trim()) {
      setErrors({ title: true });
      setTimeout(() => setErrors({}), 2000);
      return;
    }

    let imageUrl = undefined;
    if (imageFile) {
      setUploadingImage(true);
      try {
        const uploadRes = await adminEventsService.uploadImage(imageFile);
        imageUrl = uploadRes.data?.url;
      } catch (err: any) {
        toast.error("Image upload failed", { description: err.message });
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    draftMutation.mutate(buildPayload(imageUrl));
  };

  const isLoading = mutation.isPending || draftMutation.isPending;

  const field = (name: string, label: string, children: React.ReactNode) => (
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {children}
      <AnimatePresence>
        {errors[name] && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-destructive mt-1.5">
            {label} is required
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold mb-1">Create New Event</h1>
        <p className="text-muted-foreground text-sm mb-8">Fill in the details to publish your event</p>
      </motion.div>

      <AnimatePresence>
        <AnimatedStatus variant="success" title="Event published successfully!" description="Your event is now live." show={submitted} />
      </AnimatePresence>

      <form className="space-y-6 mt-4" onSubmit={(e) => e.preventDefault()}>
        {/* Cover Image */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Image size={18} className="text-primary" /> Cover Image</h2>
          <label className="block h-48 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center transition-all cursor-pointer hover:border-primary/50 relative overflow-hidden group">
            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white text-sm font-medium">Change Image</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <Image size={32} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload</p>
                <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG up to 10MB</p>
              </div>
            )}
          </label>
        </motion.div>

        {/* Basic Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold mb-2 flex items-center gap-2"><Type size={18} className="text-primary" /> Basic Info</h2>
          {field("title", "Event Title",
            <input type="text" value={form.title} onChange={set("title")} placeholder="Enter event title" className={`input-glass ${errors.title ? "input-error animate-shake" : ""}`} />
          )}
          {field("category", "Category",
            <select value={form.category} onChange={set("category")} className="input-glass">
              {["Tech", "Music", "Business", "Design", "Sports"].map((c) => <option key={c}>{c}</option>)}
            </select>
          )}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block flex items-center gap-2"><AlignLeft size={14} /> Description</label>
            <textarea rows={4} value={form.description} onChange={set("description")} placeholder="Describe your event..." className="input-glass resize-none" />
          </div>
        </motion.div>

        {/* Date & Location */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Calendar size={18} className="text-primary" /> Date & Time</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {field("startDate", "Start Date",
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="date" value={form.startDate} onChange={set("startDate")} className={`input-glass pl-10 ${errors.startDate ? "input-error" : ""}`} />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Start Time</label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="time" value={form.startTime} onChange={set("startTime")} className="input-glass pl-10" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tickets */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><DollarSign size={18} className="text-primary" /> Tickets</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {field("price", "Price ($)",
              <input type="number" min="0" step="0.01" value={form.price} onChange={set("price")} placeholder="0.00" className={`input-glass ${errors.price ? "input-error" : ""}`} />
            )}
            {field("total_tickets", "Capacity",
              <div className="relative">
                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="number" min="1" value={form.total_tickets} onChange={set("total_tickets")} placeholder="500" className={`input-glass pl-10 ${errors.total_tickets ? "input-error" : ""}`} />
              </div>
            )}
          </div>
        </motion.div>

        <div className="flex items-center gap-4">
          <RippleButton className="btn-glass flex-1" onClick={handleDraft} disabled={isLoading || uploadingImage}>
            {draftMutation.isPending || (uploadingImage && draftMutation.isPending) ? <Loader2 size={16} className="animate-spin" /> : "Save as Draft"}
          </RippleButton>
          <RippleButton className="btn-primary flex-1" onClick={handlePublish} disabled={isLoading || uploadingImage}>
            <span className="flex items-center justify-center gap-2">
              {mutation.isPending || uploadingImage ? <Loader2 size={16} className="animate-spin" /> : submitted ? <><Check size={16} /> Published!</> : "Publish Event"}
            </span>
          </RippleButton>
        </div>
      </form>
    </div>
  );
}
