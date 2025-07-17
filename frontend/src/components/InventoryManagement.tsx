import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryList } from "./InventoryList";
import { TransaksiInventoryList } from "./TransaksiInventoryList";

function InventoryManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="inventory">
          <TabsList>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="transaksi">Transaksi</TabsTrigger>
          </TabsList>
          <TabsContent value="inventory">
            <InventoryList />
          </TabsContent>
          <TabsContent value="transaksi">
            <TransaksiInventoryList />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default InventoryManagement;