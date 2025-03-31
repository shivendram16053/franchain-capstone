"use client"

import { useUser } from "@/hooks/useAuth"
import { useWallet } from "@solana/wallet-adapter-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Wallet, 
  User, 
  FileText, 
  PlusCircle, 
  ExternalLink, 
  Copy, 
  Shield, 
  Mail, 
  Phone, 
  Edit, 
  FileSignature 
} from "lucide-react"

const ProfilePage = () => {
  const wallet = useWallet()
  const { user } = useUser()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [agreements, setAgreements] = useState<any[]>([])
  const [pendingAgreements, setPendingAgreements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingPending, setIsLoadingPending] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  // Fetch user profile from Supabase
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: wallet.publicKey?.toBase58() }),
      })

      if (!response.ok) throw new Error("Failed to fetch profile")

      const data = await response.json()
      setProfile(data.user)
      localStorage.setItem("role", data.user.role)
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch agreements based on user role
  const fetchAgreements = async () => {
    if (!user?.email) return

    try {
      setIsLoading(true)
      
      const response = await fetch("/api/fetch-agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      })

      const result = await response.json()

      if (!response.ok || !result.data) {
        throw new Error(result.error || "Failed to fetch agreements")
      }

      setAgreements(result.data)
    } catch (error) {
      console.error("Error fetching agreements:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch pending agreements for franchisees to sign
  const fetchPendingAgreements = async () => {
    if (!wallet.publicKey || !profile || profile.role !== 'franchisee') return

    try {
      setIsLoadingPending(true)
      
      const response = await fetch("/api/fetch-pending-agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: wallet.publicKey.toBase58() }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch pending agreements")
      }

      setPendingAgreements(result.data || [])
    } catch (error) {
      console.error("Error fetching pending agreements:", error)
    } finally {
      setIsLoadingPending(false)
    }
  }

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchUserProfile()
    }
  }, [wallet.connected, wallet.publicKey])

  useEffect(() => {
    if (user?.email) {
      fetchAgreements()
    }
  }, [user?.email])

  useEffect(() => {
    if (profile?.role === 'franchisee' && wallet.publicKey) {
      fetchPendingAgreements()
    }
  }, [profile, wallet.publicKey])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const truncateAddress = (address: string) => {
    if (!address) return "N/A"
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="pt-20 bg-gradient-to-b from-black to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
              Profile
            </h1>
            <p className="text-gray-400 mt-2">
              {profile?.role === 'franchisor' 
                ? "Manage your agreements" 
                : "View agreements to sign"}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-gray-800 bg-opacity-50 rounded-full px-4 py-2 border border-gray-700">
            <Wallet className="h-5 w-5 text-green-400" />
            <span className="text-sm text-gray-300">
              {wallet.publicKey ? truncateAddress(wallet.publicKey.toBase58()) : "Not connected"}
            </span>
            {wallet.publicKey && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-gray-700"
                onClick={() => copyToClipboard(wallet.publicKey!.toBase58())}
              >
                <Copy className="h-3 w-3 text-gray-400" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <Card className="col-span-1 bg-gray-800 bg-opacity-50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5 text-green-400" />
                <span>Identity</span>
              </CardTitle>
              <CardDescription>Your on-chain profile details</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full bg-gray-700" />
                  <Skeleton className="h-4 w-3/4 bg-gray-700" />
                  <Skeleton className="h-4 w-5/6 bg-gray-700" />
                  <Skeleton className="h-4 w-2/3 bg-gray-700" />
                </div>
              ) : profile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-emerald-600 flex items-center justify-center text-5xl">
                        {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <Badge className="absolute -bottom-2 right-2.5 bg-green-500 hover:bg-green-600">
                        {profile.role || "User"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-green-400" />
                      <span className="text-gray-400">Name:</span>
                      <span className="ml-auto text-white">{profile.name || "N/A"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-green-400" />
                      <span className="text-gray-400">Email:</span>
                      <span className="ml-auto text-white">{profile.email || "N/A"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-400" />
                      <span className="text-gray-400">Phone:</span>
                      <span className="ml-auto text-white">{profile.phone || "N/A"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-400" />
                      <span className="text-gray-400">Role:</span>
                      <span className="ml-auto text-white">{profile.role || "N/A"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-green-400" />
                      <span className="text-gray-400">Wallet:</span>
                      <span className="ml-auto text-white">{truncateAddress(profile.wallet)}</span>
                    </div>
                  </div>

                  {profile.bio && (
                    <>
                      <Separator className="my-4 bg-gray-700" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Bio</h3>
                        <p className="text-sm text-white">{profile.bio}</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">Connect your wallet to view profile</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agreements Section */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* Franchisor: Created Agreements */}
            {profile?.role === 'franchisor' && (
              <Card className="bg-gray-800 bg-opacity-50 border-gray-700 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <FileText className="h-5 w-5 text-green-400" />
                      <span>Your Agreements</span>
                    </CardTitle>
                    <CardDescription>Agreements you've created</CardDescription>
                  </div>
                  <Button
                    onClick={() => router.push("/create")}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Agreement
                  </Button>
                </CardHeader>
                <CardContent className="pt-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full bg-gray-700" />
                      <Skeleton className="h-24 w-full bg-gray-700" />
                    </div>
                  ) : agreements.length > 0 ? (
                    <div className="grid gap-4">
                      {agreements.map((agreement, index) => (
                        <Card
                          key={index}
                          className="bg-gray-900 border-gray-700 hover:border-green-500 transition-all"
                        >
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle className="text-lg text-white">{agreement.title}</CardTitle>
                                <CardDescription className="text-sm text-gray-400">{agreement.description}</CardDescription>
                              </div>
                              <Badge
                                variant={agreement.status === "draft" ? "outline" : "default"}
                                className={
                                  agreement.status === "pending"
                                    ? "border-yellow-700 bg-yellow-900"
                                    : "bg-green-500 hover:bg-green-600"
                                }
                              >
                                {agreement.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardFooter className="flex justify-between items-center border-t border-gray-800 pt-4">
                            <span className="text-xs text-gray-500">ID: {agreement.id}</span>
                            <div className="flex gap-2">
                              {agreement.status === "draft" || agreement.status === "active"? (<></>):(
                                <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 gap-1 text-blue-400 hover:text-blue-300"
                                onClick={() => router.push(`/edit/${agreement.id}`)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                                <span>Edit</span>
                              </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 gap-1 text-green-400 hover:text-green-300"
                                onClick={() => router.push(`/agreement/${agreement.id}`)}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>View</span>
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-gray-700 rounded-lg">
                      <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-300">No agreements found</h3>
                      <p className="text-gray-500 mt-1 mb-4">Create your first smart agreement to get started</p>
                      <Button
                        onClick={() => router.push("/create")}
                        variant="outline"
                        className="border-green-500 text-green-500 hover:bg-green-500/10"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Agreement
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Franchisee: Agreements to Sign */}
            {profile?.role === 'franchisee' && (
              <Card className="bg-gray-800 bg-opacity-50 border-gray-700 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileSignature className="h-5 w-5 text-green-400" />
                    <span>Agreements to Sign</span>
                  </CardTitle>
                  <CardDescription>Pending agreements requiring your signature</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {isLoadingPending ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full bg-gray-700" />
                      <Skeleton className="h-24 w-full bg-gray-700" />
                    </div>
                  ) : pendingAgreements.length > 0 ? (
                    <div className="grid gap-4">
                      {pendingAgreements.map((agreement, index) => (
                        <Card
                          key={index}
                          className="bg-gray-900 border-gray-700 hover:border-green-500 transition-all cursor-pointer"
                          onClick={() => router.push(`/agreement/${agreement.id}`)}
                        >
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle className="text-lg text-white">{agreement.title}</CardTitle>
                                <CardDescription className="text-sm text-gray-400">{agreement.description}</CardDescription>
                              </div>
                              <Badge className="bg-yellow-600 hover:bg-yellow-700">
                                Pending Signature
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardFooter className="flex justify-between items-center border-t border-gray-800 pt-4">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>From: {truncateAddress(agreement.franchisor)}</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 gap-1 border-green-500 text-green-400 hover:bg-green-500/10"
                            >
                              <FileSignature className="h-3.5 w-3.5" />
                              <span>Review & Sign</span>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-gray-700 rounded-lg">
                      <FileSignature className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-300">No pending agreements</h3>
                      <p className="text-gray-500 mt-1">
                        You don't have any agreements pending your signature
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* My Signed Agreements (For Franchisee) */}
            {profile?.role === 'franchisee' && (
              <Card className="bg-gray-800 bg-opacity-50 border-gray-700 backdrop-blur-sm mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="h-5 w-5 text-green-400" />
                    <span>My Signed Agreements</span>
                  </CardTitle>
                  <CardDescription>Agreements you've already signed</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full bg-gray-700" />
                      <Skeleton className="h-24 w-full bg-gray-700" />
                    </div>
                  ) : agreements.length > 0 ? (
                    <div className="grid gap-4">
                      {agreements.map((agreement, index) => (
                        <Card
                          key={index}
                          className="bg-gray-900 border-gray-700 hover:border-green-500 transition-all cursor-pointer"
                          onClick={() => router.push(`/agreement/${agreement.id}`)}
                        >
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle className="text-lg text-white">{agreement.title}</CardTitle>
                                <CardDescription className="text-sm text-gray-400">{agreement.description}</CardDescription>
                              </div>
                              <Badge className="bg-green-500 hover:bg-green-600">
                                {agreement.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardFooter className="flex justify-between items-center border-t border-gray-800 pt-4">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>From: {truncateAddress(agreement.franchisor)}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 gap-1 text-green-400 hover:text-green-300"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>View</span>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-gray-700 rounded-lg">
                      <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-300">No signed agreements</h3>
                      <p className="text-gray-500 mt-1">
                        You haven't signed any agreements yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Activity or Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 bg-opacity-50 border-gray-700 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    {profile?.role === 'franchisor' ? 'Total Agreements' : 'Signed Agreements'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-green-400">{agreements.length}</span>
                    <span className="text-gray-500 text-sm mb-1">agreements</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 bg-opacity-50 border-gray-700 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    {profile?.role === 'franchisor' ? 'Wallet Status' : 'Pending Agreements'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile?.role === 'franchisor' ? (
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${wallet.connected ? "bg-green-500" : "bg-red-500"}`}></div>
                      <span className="text-lg text-white font-medium">{wallet.connected ? "Connected" : "Disconnected"}</span>
                    </div>
                  ) : (
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-yellow-400">{pendingAgreements.length}</span>
                      <span className="text-gray-500 text-sm mb-1">pending</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage