"use client"

import { CopyIcon } from "@radix-ui/react-icons"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type TransactionColumn = {
  id: string
  amount: string
  status: string
  type: string
  createdAt: string
  rawAmount: number
}

const handleCopyId = (id: string) => {
  navigator.clipboard.writeText(id).then(() => {
    toast.success('Transaction ID copied to clipboard!')
  }).catch(err => {
    console.error("Failed to copy: ", err);
    toast.error('Failed to copy transaction ID')
  });
};

export const columns: ColumnDef<TransactionColumn>[] = [
  {
    accessorKey: "id",
    header: "Transaction ID",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate max-w-[120px]">
          {row.original.id.slice(0, 8)}...
        </code>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCopyId(row.original.id)}
          className="h-6 w-6 p-0"
        >
          <CopyIcon className="h-3 w-3" />
        </Button>
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <div className={`font-semibold min-w-[100px] ${
        row.original.type === 'deposit' 
          ? 'text-green-600' 
          : 'text-red-600'
      }`}>
        {row.original.amount}
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge 
        variant={row.original.type === 'deposit' ? 'default' : 'secondary'}
        className="capitalize"
      >
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const variant = 
        status === 'success' ? 'default' :
        status === 'pending' ? 'secondary' :
        'destructive';
      
      return (
        <Badge variant={variant} className="capitalize">
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date & Time",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground min-w-[180px]">
        {row.original.createdAt}
      </div>
    ),
  },
]