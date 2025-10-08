"use client"

import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { SlotTransactionColumn, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"

interface TransactionsProps {
    data: SlotTransactionColumn[]
}

export const Transactions = ({
    data
}: TransactionsProps) => {
    const router = useRouter()

    return (
        <>
            <DataTable columns={columns} data={data} />
        </>
    )
}