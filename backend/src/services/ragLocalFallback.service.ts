// ponytail: rule-based offline fallback for chat intent and task breakdown. upgrade to dynamic rag when llm available.
export class RagLocalFallbackService {
  static generateSmartLocalResponse(
    activeTasks: any[],
    message: string,
    userName: string,
    alertNotice?: string
  ): string {
    const q = message.toLowerCase();
    const prefix = alertNotice ? `${alertNotice}\n\n` : "";
    const todoTasks = activeTasks.filter((t) => t.status !== "done");

    // 1. WhatsApp sharing intent
    if (q.includes("whatsapp") || q.includes("wa") || q.includes("kirim")) {
      const taskList = todoTasks.slice(0, 5).map((t, i) => {
        const dl = t.dueDate ? ` (Deadline: ${new Date(t.dueDate).toLocaleDateString("id-ID")})` : "";
        return `${i + 1}. *${t.title}* [${t.priority.toUpperCase()}]${dl}`;
      }).join("\n");

      return `${prefix}Halo **${userName}**! Berikut ringkasan jadwal tugas aktif Anda yang siap dikirim ke WhatsApp:

📅 **Jadwal Prioritas Tugas:**
${taskList || "Semua tugas telah selesai!"}

💡 *Tips:* Klik tombol **Kirim ke WA** di bawah pesan ini untuk langsung mengirimkannya ke WhatsApp Anda!`;
    }

    // 2. Priority check intent
    if (q.includes("prioritas") || q.includes("penting") || q.includes("hari ini")) {
      const urgentTasks = todoTasks
        .filter((t) => t.priority === "urgent" || t.priority === "high")
        .slice(0, 3);

      if (urgentTasks.length > 0) {
        const list = urgentTasks.map((t, i) => {
          const dl = t.dueDate ? ` - Deadline: ${new Date(t.dueDate).toLocaleDateString("id-ID")}` : "";
          const subDone = t.subtasks ? t.subtasks.filter((s: any) => s.isCompleted).length : 0;
          const subTotal = t.subtasks ? t.subtasks.length : 0;
          return `${i + 1}. **${t.title}** (${t.priority.toUpperCase()}${dl}) - Subtask: ${subDone}/${subTotal}`;
        }).join("\n");

        return `${prefix}Halo **${userName}**! Berikut tugas paling prioritas yang disarankan untuk diselesaikan terlebih dahulu:

🔥 **Tugas Prioritas Utama:**
${list}

Fokuslah menyelesaikan subtask dari tugas di atas sebelum beralih ke tugas lain!`;
      }
    }

    // 3. Weekly / planning intent
    if (q.includes("minggu") || q.includes("rencana") || q.includes("jadwal")) {
      return `${prefix}Halo **${userName}**! Rencana pengerjaan tugas Anda untuk pekan ini:

📌 **Rencana Bertahap:**
- **Hari 1 - 2:** Selesaikan tugas berstatus Urgent/High yang mendekati tenggat waktu.
- **Hari 3 - 4:** Lanjutkan pengerjaan tugas berstatus In-Progress dan selesaikan checklist subtask.
- **Hari 5 - 7:** Review tugas selesai dan mulai cicil tugas Medium/Low.

Anda memiliki **${todoTasks.length} tugas aktif** yang belum selesai. Tetap semangat!`;
    }

    // 4. Default task overview response
    const totalDone = activeTasks.filter((t) => t.status === "done").length;
    const top3 = todoTasks.slice(0, 3).map((t, i) => `${i + 1}. **${t.title}** [${t.priority}]`).join("\n");

    return `${prefix}Halo **${userName}**! Saya Zalde AI Copilot.

📊 **Status Produktivitas Anda:**
- Total Tugas Aktif: **${todoTasks.length}** tugas belum selesai
- Tugas Selesai: **${totalDone}** tugas

📋 **Tugas Utama Saat Ini:**
${top3 || "Semua tugas telah terselesaikan dengan baik!"}

Tanyakan kepada saya kapan saja untuk *"Kirim ringkasan ke WA"* atau *"Apa tugas paling prioritas?"*!`;
  }

  static generateSmartBreakdown(title: string, _description?: string): string[] {
    const t = title.toLowerCase();

    if (t.includes("skripsi") || t.includes("bab") || t.includes("revisi") || t.includes("laporan")) {
      return [
        "Kumpulkan literatur & jurnal referensi terbaru",
        "Tulis dan perbaiki draf materi sesuai catatan",
        "Cek format penulisan, sitasi, dan tata bahasa",
        "Bimbingan dan konsultasi hasil revisi",
      ];
    }

    if (t.includes("auth") || t.includes("api") || t.includes("coding") || t.includes("bug") || t.includes("fitur")) {
      return [
        "Analisis kebutuhan logika dan arsitektur endpoint",
        "Implementasi kode fungsi dan skema data",
        "Pengujian unit test & verifikasi respon API",
        "Integrasi tampilan antarmuka (UI) frontend",
      ];
    }

    if (t.includes("belajar") || t.includes("tutorial") || t.includes("course") || t.includes("modul")) {
      return [
        "Pelajari materi dan konsep dasar modul",
        "Praktik langsung melalui pembuatan demo proyek",
        "Catat poin penting dan buat dokumentasi pribadi",
      ];
    }

    if (t.includes("rapat") || t.includes("organisasi") || t.includes("event") || t.includes("seminar")) {
      return [
        "Siapkan agenda pembahasan dan materi rapat",
        "Koordinasi pembagian tugas antar anggota tim",
        "Notulensi kesepakatan dan tindak lanjut (action items)",
      ];
    }

    return [
      `Persiapan bahan dan analisis kebutuhan untuk "${title}"`,
      `Eksekusi pengerjaan langkah teknis utama`,
      `Pemeriksaan kualitas hasil pengerjaan`,
      `Finalisasi dan tandai tugas sebagai selesai`,
    ];
  }
}
