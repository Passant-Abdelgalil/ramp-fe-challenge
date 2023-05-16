export type Transaction = {
  id: string
  amount: number
  employee: Employee
  merchant: string
  date: string
  approved: boolean
}

export type Employee = {
  id: string
  firstName: string
  lastName: string
}

export type PaginatedResponse<TData> = {
  data: TData
  nextPage: number | null
}

export type PaginatedRequestParams = {
  page: number | null
}

export type RequestByEmployeeParams = {
  employeeId: string
}

export type SetTransactionApprovalParams = {
  transactionId: string
  value: boolean
}

export function isPaginatedResponse(obj: any): obj is PaginatedResponse<Transaction[]> {
  return obj.data !== undefined && obj.nextPage !== undefined
}

export function isEmployee(obj: any): obj is Employee {
  return (
    typeof obj.id === "string" && typeof obj.firstName === "string" && typeof obj.lastName === "string"
  )
}

export function isTransaction(obj: any): obj is Transaction {
  return (
    typeof obj.id === "string" &&
    typeof obj.amount === "number" &&
    isEmployee(obj.employee) &&
    typeof obj.merchant === "string" &&
    typeof obj.date === "string" &&
    typeof obj.approved === "boolean"
  )
}
