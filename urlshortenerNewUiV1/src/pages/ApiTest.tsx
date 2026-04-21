import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authAPI, urlsAPI, domainsAPI, analyticsAPI } from "@/services/api";

/**
 * API Test Page
 * 
 * This page is for testing the API connection.
 * Navigate to /api-test to use it.
 * 
 * To add this route to your app, add this to App.tsx:
 * <Route path="/api-test" element={<ApiTest />} />
 */
const ApiTest = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState<string | null>(null);

  const testEndpoint = async (name: string, fn: () => Promise<any>) => {
    setLoading(name);
    try {
      const result = await fn();
      setResults((prev: any) => ({ ...prev, [name]: { success: true, data: result } }));
      toast({
        title: "Success",
        description: `${name} test passed`,
      });
    } catch (error: any) {
      setResults((prev: any) => ({ ...prev, [name]: { success: false, error: error.message } }));
      toast({
        title: "Error",
        description: `${name} test failed: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Connection Test</h1>
        <p className="text-muted-foreground">
          Test the backend API connection and endpoints
        </p>
      </div>

      {/* Authentication Tests */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication Tests</CardTitle>
          <CardDescription>Test login, register, and profile endpoints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => testEndpoint("Login", () => authAPI.login({ email, password }))}
              disabled={loading === "Login"}
            >
              {loading === "Login" ? "Testing..." : "Test Login"}
            </Button>

            <Button
              onClick={() => testEndpoint("Register", () => authAPI.register({ email, password, name: "Test User" }))}
              disabled={loading === "Register"}
              variant="outline"
            >
              {loading === "Register" ? "Testing..." : "Test Register"}
            </Button>

            <Button
              onClick={() => testEndpoint("Get Profile", () => authAPI.getProfile())}
              disabled={loading === "Get Profile"}
              variant="outline"
            >
              {loading === "Get Profile" ? "Testing..." : "Test Get Profile"}
            </Button>

            <Button
              onClick={() => testEndpoint("Logout", () => authAPI.logout())}
              disabled={loading === "Logout"}
              variant="outline"
            >
              {loading === "Logout" ? "Testing..." : "Test Logout"}
            </Button>
          </div>

          {results.Login && (
            <div className={`p-4 rounded-lg ${results.Login.success ? "bg-green-50" : "bg-red-50"}`}>
              <p className="font-semibold mb-2">Login Result:</p>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(results.Login, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* URL Tests */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>URL Management Tests</CardTitle>
          <CardDescription>Test URL creation, listing, and management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => testEndpoint("List URLs", () => urlsAPI.list({ page: 1, limit: 10 }))}
              disabled={loading === "List URLs"}
            >
              {loading === "List URLs" ? "Testing..." : "Test List URLs"}
            </Button>

            <Button
              onClick={() => testEndpoint("Create URL", () => urlsAPI.create({
                originalUrl: "https://example.com",
                customCode: `test${Date.now()}`,
                title: "Test Link"
              }))}
              disabled={loading === "Create URL"}
              variant="outline"
            >
              {loading === "Create URL" ? "Testing..." : "Test Create URL"}
            </Button>

            <Button
              onClick={() => testEndpoint("Get Stats", () => urlsAPI.getStats())}
              disabled={loading === "Get Stats"}
              variant="outline"
            >
              {loading === "Get Stats" ? "Testing..." : "Test Get Stats"}
            </Button>

            <Button
              onClick={() => testEndpoint("Available Domains", () => urlsAPI.getAvailableDomains())}
              disabled={loading === "Available Domains"}
              variant="outline"
            >
              {loading === "Available Domains" ? "Testing..." : "Test Available Domains"}
            </Button>
          </div>

          {results["List URLs"] && (
            <div className={`p-4 rounded-lg ${results["List URLs"].success ? "bg-green-50" : "bg-red-50"}`}>
              <p className="font-semibold mb-2">List URLs Result:</p>
              <pre className="text-xs overflow-auto max-h-64">
                {JSON.stringify(results["List URLs"], null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Domain Tests */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Domain Management Tests</CardTitle>
          <CardDescription>Test domain listing and management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => testEndpoint("List Domains", () => domainsAPI.getDomains())}
              disabled={loading === "List Domains"}
            >
              {loading === "List Domains" ? "Testing..." : "Test List Domains"}
            </Button>

            <Button
              onClick={() => testEndpoint("Domain Stats", () => domainsAPI.getDomainStats())}
              disabled={loading === "Domain Stats"}
              variant="outline"
            >
              {loading === "Domain Stats" ? "Testing..." : "Test Domain Stats"}
            </Button>
          </div>

          {results["List Domains"] && (
            <div className={`p-4 rounded-lg ${results["List Domains"].success ? "bg-green-50" : "bg-red-50"}`}>
              <p className="font-semibold mb-2">List Domains Result:</p>
              <pre className="text-xs overflow-auto max-h-64">
                {JSON.stringify(results["List Domains"], null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Tests */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Analytics Tests</CardTitle>
          <CardDescription>Test analytics endpoints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => testEndpoint("Analytics Dashboard", () => analyticsAPI.getDashboard())}
              disabled={loading === "Analytics Dashboard"}
            >
              {loading === "Analytics Dashboard" ? "Testing..." : "Test Analytics Dashboard"}
            </Button>
          </div>

          {results["Analytics Dashboard"] && (
            <div className={`p-4 rounded-lg ${results["Analytics Dashboard"].success ? "bg-green-50" : "bg-red-50"}`}>
              <p className="font-semibold mb-2">Analytics Dashboard Result:</p>
              <pre className="text-xs overflow-auto max-h-64">
                {JSON.stringify(results["Analytics Dashboard"], null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Info */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="font-semibold">API URL:</span>{" "}
            <code className="bg-muted px-2 py-1 rounded">
              {import.meta.env.VITE_API_URL || "http://localhost:3015/api"}
            </code>
          </div>
          <div>
            <span className="font-semibold">Auth Token:</span>{" "}
            <code className="bg-muted px-2 py-1 rounded text-xs">
              {localStorage.getItem("authToken") || "Not set"}
            </code>
          </div>
          <div>
            <span className="font-semibold">Tests Run:</span>{" "}
            <span>{Object.keys(results).length}</span>
          </div>
          <div>
            <span className="font-semibold">Tests Passed:</span>{" "}
            <span className="text-green-600">
              {Object.values(results).filter((r: any) => r.success).length}
            </span>
          </div>
          <div>
            <span className="font-semibold">Tests Failed:</span>{" "}
            <span className="text-red-600">
              {Object.values(results).filter((r: any) => !r.success).length}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiTest;
