import getConversationById from "@/actions/get-conversation-by-id";
import getMessages from "@/actions/get-messages";
import Body from "@/app/(main)/(protected)/_components/body";
import Form from "@/app/(main)/(protected)/_components/form";
import MarkAsReadUser from "./mark-as-read";

interface IParams {
    supportId: string;
}

const ConversationId = async ({ params }: { params: IParams }) => {
    const conversation = await getConversationById(params.supportId)
    const messages = await getMessages(params.supportId)

    if (!conversation) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-red-600">Conversation not found</div>
            </div>
        )
    }

    return (
        <div className="overflow-y-auto h-full">
            <MarkAsReadUser conversationId={params.supportId} />
            
            <Body initialMessages={messages} />
            <div className="bg-black w-full px-5 pb-[60px] flex">
                <Form />
            </div>
        </div>
    )
}

export default ConversationId;