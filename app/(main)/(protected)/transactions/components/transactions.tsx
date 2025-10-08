"use client"

import { MinusIcon, PlusIcon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { TransactionColumn, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"

interface TransactionsProps {
  data: TransactionColumn[];
  isBlocked: boolean;
}

export const Transactions = ({ data, isBlocked }: TransactionsProps) => {
  const router = useRouter()

  const handleClick = (path: string) => {
    if (!isBlocked) {
      router.push(path);
    }
  }

  return (
    <>
      <div className="flex sm:items-center justify-between sm:flex-row flex-col items-start gap-5">
        <Button 
          onClick={() => handleClick('/transactions/new/deposit')}
          disabled={isBlocked}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          To Deposit
        </Button>
        <Button 
          onClick={() => handleClick('/transactions/new/withdrawal')}
          disabled={isBlocked}
        >
          <MinusIcon className="mr-2 h-4 w-4" />
          To Withdraw
        </Button>
      </div>
      <Separator />
      <DataTable columns={columns} data={data} />
    </>
  )
}
