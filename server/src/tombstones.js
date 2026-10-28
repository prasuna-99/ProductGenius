// Deletion tombstones (shared helper).
// Every API delete records (table, recordId) in the SAME transaction as the
// row removal, so other browsers learn the deletion at sync time instead of
// resurrecting the row through /sync/push. Orders/Transactions are never
// tombstoned: purchase history must survive product deletion.
async function tombstone(db, table, recordId, deletedBy) {
  await db.deletedRecord.upsert({
    where: { table_recordId: { table, recordId } },
    update: {},
    create: { table, recordId, deletedBy: deletedBy || null },
  });
}

module.exports = { tombstone };
