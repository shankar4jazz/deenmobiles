import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  console.log('=== BRANCHES ===');
  const branches = await prisma.branch.findMany({ 
    select: { id: true, name: true } 
  });
  branches.forEach(b => console.log(`${b.name}: ${b.id}`));
  
  console.log('\n=== BRANCH INVENTORY COUNT ===');
  const inventoryCount = await prisma.branchInventory.count();
  console.log(`Total: ${inventoryCount}`);
  
  if (inventoryCount > 0) {
    const sample = await prisma.branchInventory.findFirst({
      include: { item: { select: { itemName: true } } }
    });
    console.log(`\nSample inventory branchId: ${sample?.branchId}`);
    console.log(`Sample item: ${sample?.item.itemName}`);
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
