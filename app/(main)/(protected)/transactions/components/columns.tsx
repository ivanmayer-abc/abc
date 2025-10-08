"use client"

import { CopyIcon } from "@radix-ui/react-icons"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

export type TransactionColumn = {
  id: string
  amount: string
  status: string
  createdAt: string
}

export const columns: ColumnDef<TransactionColumn>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
    <div
      onClick={() => handleCopyId(row.original.id)} 
      className="cursor-pointer relative group"
    >
      {row.original.id}
      <CopyIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black p-1 w-7 h-7 border rounded-xl" />
    </div>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "createdAt",
    header: "Date",
  },
]

const handleCopyId = (id: string) => {
  if (id) {
    navigator.clipboard.writeText(id).then(() => {
      toast.success('Copied to cliboard!')
    }).catch(err => {
      console.error("Failed to copy: ", err);
    });
  }
};