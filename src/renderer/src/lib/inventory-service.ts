import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  writeBatch
} from 'firebase/firestore'
import { db } from './firebase'
import { InventoryItem } from '../types/inventory'
import { inventorySeed } from './inventory-seed'

const COLLECTION = 'inventory'

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const snapshot = await getDocs(collection(db, COLLECTION))
  if (snapshot.empty) return []
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem))
}

export async function seedInventory(): Promise<void> {
  const existing = await getDocs(collection(db, COLLECTION))
  if (!existing.empty) return // already seeded

  const batch = writeBatch(db)
  inventorySeed.forEach(item => {
    const ref = doc(collection(db, COLLECTION))
    batch.set(ref, item)
  })
  await batch.commit()
}

export async function updateInventoryItem(
  id: string,
  data: Partial<InventoryItem>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data)
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}

export function subscribeToInventory(
  callback: (items: InventoryItem[]) => void
): () => void {
  return onSnapshot(collection(db, COLLECTION), (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem))
    callback(items)
  })
}
