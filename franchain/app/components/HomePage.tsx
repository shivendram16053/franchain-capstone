"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, FileText, Wallet, Search, AlertCircle, Loader2, PlusCircle, Calendar, Tag } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const HomePage = () => {
  interface Agreement {
    id: string
    title: string
    status: string
    contract_duration: number
    initial_fee: string
    franchisor?: string
  }

  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [filteredAgreements, setFilteredAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const router = useRouter()

  useEffect(() => {
    const fetchAgreements = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/fetch-all-agreements", {
          method: "GET",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch agreements")
        }

        const result = await response.json()

        if (result.data) {
          setAgreements(result.data)
          setFilteredAgreements(result.data)
        }
      } catch (err) {
        console.error("Error fetching agreements:", err)
        setError("Failed to load agreements. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchAgreements()
  }, [])

  useEffect(() => {
    // Filter agreements based on search term and status filter
    let filtered = agreements

    if (searchTerm) {
      filtered = filtered.filter((agreement) => agreement.title.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((agreement) => agreement.status.toLowerCase() === statusFilter.toLowerCase())
    }

    setFilteredAgreements(filtered)
  }, [searchTerm, statusFilter, agreements])

  const handleCardClick = (id: string) => {
    router.push(`/agreement/${id}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
      case "terminated":
        return <Badge className="bg-red-500 hover:bg-red-600">Terminated</Badge>
      case "expired":
        return <Badge className="bg-gray-500 hover:bg-gray-600">Expired</Badge>
      default:
        return <Badge className="bg-blue-500 hover:bg-blue-600">{status}</Badge>
    }
  }

  const renderSkeletons = () => {
    return Array(6)
      .fill(0)
      .map((_, index) => (
        <Card key={index} className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-3/4 bg-gray-700" />
              <Skeleton className="h-5 w-16 rounded-full bg-gray-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full bg-gray-700" />
              <Skeleton className="h-4 w-full bg-gray-700" />
              <Skeleton className="h-4 w-3/4 bg-gray-700" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-4 w-1/3 ml-auto bg-gray-700" />
          </CardFooter>
        </Card>
      ))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 mb-2">
            Blockchain Agreements
          </h1>
          <p className="text-gray-300">Browse and manage your on-chain franchise agreements</p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search agreements..."
              className="pl-10 bg-gray-800/50 border-gray-700 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Button
              asChild
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              <Link href="/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{renderSkeletons()}</div>
        ) : error ? (
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm p-8 text-center">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">Error Loading Agreements</h2>
              <p className="text-gray-300 max-w-md mb-6">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-green-500 text-green-400 hover:bg-green-500/10"
              >
                <Loader2 className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </Card>
        ) : filteredAgreements.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm p-8 text-center">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                <FileText className="h-10 w-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">No Agreements Found</h2>
              <p className="text-gray-300 max-w-md mb-6">
                {searchTerm || statusFilter !== "all"
                  ? "No agreements match your current filters. Try adjusting your search criteria."
                  : "There are currently no franchise agreements available. Create a new agreement to get started."}
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                <Link href="/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Agreement
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgreements.map((agreement) => (
              <Card
                key={agreement.id}
                className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:border-green-500/50 transition-all cursor-pointer group"
                onClick={() => handleCardClick(agreement.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-white truncate" title={agreement.title}>
                      {agreement.title}
                    </CardTitle>
                    {getStatusBadge(agreement.status)}
                  </div>
                  <CardDescription className="text-gray-400 truncate">
                    ID: {agreement.id}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-300">
                      <Calendar className="h-4 w-4 mr-2 text-green-400" />
                      <span>Duration: {agreement.contract_duration} months</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Tag className="h-4 w-4 mr-2 text-green-400" />
                      <span>Initial Fee: {Number.parseFloat(agreement.initial_fee).toLocaleString()} USDC</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Wallet className="h-4 w-4 mr-2 text-green-400" />
                      <span className="truncate">
                        Franchisor:{" "}
                        {agreement.franchisor
                          ? `${agreement.franchisor.substring(0, 6)}...${agreement.franchisor.substring(agreement.franchisor.length - 4)}`
                          : "Not specified"}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t border-gray-700">
                  <div className="text-green-400 group-hover:translate-x-1 transition-transform flex items-center ml-auto">
                    View Details <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage

