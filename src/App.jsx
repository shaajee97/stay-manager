import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function StayManagerApp() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({
    guestName: "",
    checkIn: "",
    checkOut: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadBookings();
  }, [session]);

  async function loadBookings() {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("check_in", { ascending: true });

    setBookings(data || []);
  }

  async function handleAuth() {
    await supabase.auth.signInWithPassword({ email, password });
  }

  async function handleSignup() {
    await supabase.auth.signUp({ email, password });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function addBooking() {
    if (!session) return;

    await supabase.from("bookings").insert({
      guest_name: form.guestName,
      check_in: form.checkIn,
      check_out: form.checkOut,
      source: "direct",
      source_label: "Direct",
      requested_type: "suite_b",
      assigned_space: "suite_b",
      status: "Confirmed",
      created_by: session.user.id,
    });

    setForm({ guestName: "", checkIn: "", checkOut: "" });
    loadBookings();
  }

  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Stay Manager Login</h2>
        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />
        <button onClick={handleAuth}>Login</button>
        <button onClick={handleSignup}>Create Account</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Stay Manager</h2>
      <p>Logged in as {session.user.email}</p>

      <button onClick={handleLogout}>Logout</button>

      <h3>Add Booking</h3>
      <input
        placeholder="Guest Name"
        value={form.guestName}
        onChange={(e) =>
          setForm({ ...form, guestName: e.target.value })
        }
      />
      <br />
      <input
        type="date"
        value={form.checkIn}
        onChange={(e) =>
          setForm({ ...form, checkIn: e.target.value })
        }
      />
      <br />
      <input
        type="date"
        value={form.checkOut}
        onChange={(e) =>
          setForm({ ...form, checkOut: e.target.value })
        }
      />
      <br /><br />
      <button onClick={addBooking}>Add Booking</button>

      <h3>Bookings</h3>
      <ul>
        {bookings.map((b) => (
          <li key={b.id}>
            {b.guest_name} — {b.check_in} to {b.check_out}
          </li>
        ))}
      </ul>
    </div>
  );
}
