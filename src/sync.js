// Firebase sync (Auth: anonymous, Firestore). Loaded lazily, only after the user has consented and only if firebase-config.js is filled in.
// Layout: groups/{CODE} {name, owner, createdAt}
//         groups/{CODE}/members/{uid} {name, avatar, joinedAt}
//         groups/{CODE}/state/lunch | poll
//         groups/{CODE}/events/{id}
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, deleteUser } from "firebase/auth";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator,
  doc, collection, setDoc, getDocs, updateDoc, deleteDoc, deleteField, onSnapshot, arrayUnion, serverTimestamp
} from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";
import { config } from "./firebase-config.js";

export const enabled = !!(config && config.apiKey && config.projectId);
let app, auth, db;

export async function start(emulator) {
  if (!app) {
    app = initializeApp(emulator ? { apiKey: "demo", projectId: "demo-stayka" } : config);
    auth = getAuth(app);
    db = initializeFirestore(app, { ignoreUndefinedProperties: true, localCache: emulator ? undefined : persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
    if (emulator) { connectAuthEmulator(auth, emulator.auth, { disableWarnings: true }); connectFirestoreEmulator(db, emulator.host, emulator.firestore); }
  }
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser.uid;
}

const G = gid => doc(db, "groups", gid);
const S = (gid, name) => doc(db, "groups", gid, "state", name);
const member = (profile) => ({ name: String(profile.name || "").slice(0, 20), avatar: profile.avatar || "", joinedAt: serverTimestamp() });

export async function createGroup(gid, name, profile, lunch, poll, events) {
  const uid = auth.currentUser.uid;
  await setDoc(G(gid), { name: name.slice(0, 40), owner: uid, createdAt: serverTimestamp() });
  await setDoc(doc(db, "groups", gid, "members", uid), member(profile));
  await setDoc(S(gid, "lunch"), lunch);
  await setDoc(S(gid, "poll"), poll);
  for (const [id, e] of events || []) await setDoc(doc(db, "groups", gid, "events", id), e);
}
// Throws { code: "not-found" } when no such group exists.
export async function joinGroup(gid, profile) {
  const uid = auth.currentUser.uid;
  try { await setDoc(doc(db, "groups", gid, "members", uid), member(profile)); }
  catch (e) { if (e && e.code === "permission-denied") { const err = new Error("not-found"); err.code = "not-found"; throw err; } throw e; }
}
export const putMember = (gid, profile) => setDoc(doc(db, "groups", gid, "members", auth.currentUser.uid), member(profile), { merge: true });
export const renameGroup = (gid, name) => updateDoc(G(gid), { name: name.slice(0, 40) });

export const setLunch = (gid, l) => setDoc(S(gid, "lunch"), l);
export const respLunch = (gid, uid, v) => updateDoc(S(gid, "lunch"), { ["resp." + uid]: v || deleteField() });
export const vote = (gid, uid, optId) => updateDoc(S(gid, "poll"), { ["votes." + uid]: optId || deleteField(), win: null });
export const addOpt = (gid, o) => updateDoc(S(gid, "poll"), { opts: arrayUnion(o) });
export const setWin = (gid, w) => updateDoc(S(gid, "poll"), { win: w });
export const setEvent = (gid, id, e) => setDoc(doc(db, "groups", gid, "events", id), e);
export const rsvp = (gid, id, uid, v) => updateDoc(doc(db, "groups", gid, "events", id), { ["rsvp." + uid]: v || deleteField() });

// Remove everything this user left in the group (answers, votes, RSVPs) and then leave it.
export async function leave(gid) {
  const uid = auth.currentUser.uid;
  await updateDoc(S(gid, "lunch"), { ["resp." + uid]: deleteField() }).catch(() => {});
  await updateDoc(S(gid, "poll"), { ["votes." + uid]: deleteField() }).catch(() => {});
  const evs = await getDocs(collection(db, "groups", gid, "events")).catch(() => ({ docs: [] }));
  for (const d of evs.docs) { const r = d.data().rsvp; if (r && uid in r) await updateDoc(d.ref, { ["rsvp." + uid]: deleteField() }); }
  await deleteDoc(doc(db, "groups", gid, "members", uid));
}
// GDPR erasure: leave every group, then delete the anonymous account itself.
export async function deleteAccount(gids) {
  for (const g of gids) await leave(g);
  await deleteUser(auth.currentUser);
}

// Live listeners. h: { group(data|null), members(list), lunch(data|null), poll(data|null), events(list of [id, data]), error(e) }
export function watch(gid, h) {
  const err = e => h.error && h.error(e);
  const u = [
    onSnapshot(G(gid), s => h.group(s.exists() ? s.data() : null), err),
    onSnapshot(collection(db, "groups", gid, "members"), s => h.members(s.docs.map(d => ({ uid: d.id, ...d.data() }))), err),
    onSnapshot(S(gid, "lunch"), s => h.lunch(s.exists() ? s.data() : null), err),
    onSnapshot(S(gid, "poll"), s => h.poll(s.exists() ? s.data() : null), err),
    onSnapshot(collection(db, "groups", gid, "events"), s => h.events(s.docs.map(d => [d.id, d.data()])), err)
  ];
  return () => u.forEach(f => f());
}
