"use client"

import useConversation from "@/hooks/use-conversation";
import axios from "axios";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import MessageInput from "./message-input";
import IconWithHover from "./image-icon";
import SendWithHover from "./send-icon";
import { useSession } from "next-auth/react";
import { useTranslations } from 'next-intl';
import { useRef } from "react";

const Form = () => {
    const { supportId } = useConversation();
    const { data: session } = useSession();
    const t = useTranslations('Support');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors }
    } = useForm<FieldValues>({
        defaultValues: {
            message: ''
        }
    });

    const isChatBlocked = session?.user?.isChatBlocked;

    const onSubmit: SubmitHandler<FieldValues> = (data) => {
        if (isChatBlocked) return;

        setValue('message', '', { shouldValidate: true });
        axios.post('/api/messages', {
            ...data,
            supportId
        });
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (isChatBlocked) return;

        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/chat/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            
            axios.post('/api/messages', {
                image: data.imageUrl,
                supportId
            });

        } catch (error) {
            console.error('Image upload error:', error);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="flex gap-5 w-full fixed bottom-0 left-0 bg-black px-4 py-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={isChatBlocked}
            />
            
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isChatBlocked}
            >
                <IconWithHover isDisabled={isChatBlocked} />
            </button>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex gap-5 w-full"
            >
                <MessageInput
                    id="message"
                    register={register}
                    errors={errors}
                    required
                    placeholder={isChatBlocked ? t('chatBlocked') : t('writeMessage')}
                    disabled={isChatBlocked}
                    maxLength={5000}
                />
                <button
                    type="submit"
                    disabled={isChatBlocked}
                >
                    <SendWithHover isDisabled={isChatBlocked} />
                </button>
            </form>
        </div>
    );
};

export default Form;