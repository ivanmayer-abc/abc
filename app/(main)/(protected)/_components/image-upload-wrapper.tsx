"use client";

import * as z from "zod";
import axios from "axios";
import { useState } from "react";
import ImageUpload from "@/components/upload-image";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  userImage: z.object({ url: z.string() })
});

type ImageFormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  userId: string | undefined;
  userImage?: {
    id: string;
    userId: string;
    url: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

export const ImageUploadWrapper: React.FC<UserFormProps> = ({ userImage, userId }) => {
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ImageFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userImage: userImage ? { url: userImage.url } : { url: "" },
    },
  });

  const watchUserImage = form.watch("userImage");

  const onSubmit = async (data: ImageFormValues) => {
    try {
      setLoading(true);

      await axios.patch(`/api/upload-user-image/${userId}`, data);

      toast.success("Image uploaded successfully!");

      setIsSubmitted(true);

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
        <FormField
          control={form.control}
          name="userImage"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  disabled={loading || isSubmitted}
                  onChange={(url: string) => {
                    field.onChange({ url });
                  }}
                  onRemove={() => field.onChange({ url: "" })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className="text-xl px-10 py-6"
          type="submit"
          disabled={loading || !watchUserImage.url || isSubmitted}
        >
          {isSubmitted ? "Submitted" : "Submit"}
        </Button>
      </form>
    </Form>
  );
};