import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KoperasiManagement from "./KoperasiManagement";
import PetaniManagement from "./PetaniManagement";
import LahanManagement from "./LahanManagement";

function FarmManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Farm Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="koperasi">
          <TabsList>
            <TabsTrigger value="koperasi">Koperasi</TabsTrigger>
            <TabsTrigger value="petani">Petani</TabsTrigger>
            <TabsTrigger value="lahan">Lahan</TabsTrigger>
          </TabsList>
          <TabsContent value="koperasi">
            <KoperasiManagement />
          </TabsContent>
          <TabsContent value="petani">
            <PetaniManagement />
          </TabsContent>
          <TabsContent value="lahan">
            <LahanManagement />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default FarmManagement;