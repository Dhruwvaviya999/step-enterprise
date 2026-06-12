import Link from "next/link";
import type { Metadata } from "next";
import { Building2, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

export const metadata: Metadata = { title: "Companies" };

const dateFmt = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function SuperAdminDashboardPage() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground">
            Register and manage the companies on the platform.
          </p>
        </div>
        <Link href="/super-admin/companies/new">
          <Button>
            <Plus className="size-4" />
            Register company
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All companies</CardTitle>
          <CardDescription>
            {companies.length}{" "}
            {companies.length === 1 ? "company" : "companies"} registered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2 />
                </EmptyMedia>
                <EmptyTitle>No companies yet</EmptyTitle>
                <EmptyDescription>
                  Register your first company to get started.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link href="/super-admin/companies/new">
                  <Button>
                    <Plus className="size-4" />
                    Register company
                  </Button>
                </Link>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-center">Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      {company.name}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {company.code}
                    </TableCell>
                    <TableCell className="text-center">
                      {company._count.users}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={company.isActive ? "secondary" : "outline"}
                      >
                        {company.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {dateFmt.format(company.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
