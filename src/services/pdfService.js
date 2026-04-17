import jsPDF from 'jspdf';
import autotable from 'jspdf-autotable';
// import logoUrl from '../assets/images/logoKFTech.jpg';

class PDFService {
  // ─── Palette ───────────────────────────────────────────────────────────────
  static C = {
  navy:      [140,  60,  10],   // header principal     → brun-orange foncé
  blue:      [195,  90,  30],   // accents              → orange moyen doux
  blueLight: [255, 243, 230],   // fond section         → crème orangé
  teal:      [0,   150, 100],   // stat positive        → vert (inchangé)
  red:       [211,  47,  47],   // stat négative        → rouge (inchangé)
  orange:    [210, 155,  50],   // avertissement        → or cuivré
  dark:      [30,   25,  20],   // texte principal      → brun très foncé
  mid:       [110,  95,  80],   // texte secondaire     → gris chaud
  light:     [255, 250, 244],   // fond alternance      → blanc cassé chaud
  border:    [225, 205, 185],   // lignes               → beige orangé
  white:     [255, 255, 255],
};

  

  // ─── URL du logo — remplacez ici ───────────────────────────────────────────
  static LOGO_URL = null;// chemin vers votre logo (png recommandé pour la transparence)
  static async loadLogo() {
    if (PDFService.LOGO_URL) return; // déjà en cache
    try {
      const res = await fetch('/assets/images/logoKFTech.jpg');
      if (!res.ok) throw new Error('Logo introuvable');
      const blob = await res.blob();
      PDFService.LOGO_URL = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Logo non chargé:', e.message);
      PDFService.LOGO_URL = null;
    }
  }
  static SHOP_NAME = 'KF TECH';
  static SHOP_SUBTITLE = 'Gestion des inventaires';

  // ─── Créer le doc ──────────────────────────────────────────────────────────
  static createDoc() {
    return new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  }

  // ─── Header moderne avec logo ──────────────────────────────────────────────
  static addHeader(doc, title) {
    const C = this.C;

    // Fond header navy
    doc.setFillColor(...C.navy);
    doc.rect(0, 0, 210, 38, 'F');

    // Bande accent bleue fine en bas du header
    doc.setFillColor(...C.orange);
    doc.rect(0, 35, 210, 3, 'F');

    // ── Zone logo (gauche) ──
    // Fond blanc arrondi pour le logo
    doc.setFillColor(...C.white);
    doc.roundedRect(10, 5, 28, 28, 2, 2, 'F');

    // Tentative de chargement du logo
    try {
      doc.addImage(this.LOGO_URL, 'PNG', 11, 6, 26, 26);
    } catch {
      // Placeholder si le logo ne charge pas : initiales stylisées
      doc.setFillColor(...C.blueLight);
      doc.roundedRect(10, 5, 28, 28, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...C.navy);
      doc.text('LOGO', 24, 21, { align: 'center' });
    }

    // ── Nom boutique + sous-titre (milieu-gauche) ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...C.white);
    doc.text(this.SHOP_NAME, 44, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 200, 240);
    doc.text(this.SHOP_SUBTITLE, 44, 21);

    doc.setFontSize(7);
    doc.text('NIU: M092518287412M | RGCM: CM-DLA-01-2025-B113-01196', 44, 26);
    doc.text('Douala, rond-point deido', 44, 30);

    // ── Titre du rapport (droite) ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...C.white);
    doc.text(title, 196, 14, { align: 'right' });

    // Date de génération
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(160, 185, 230);
    doc.text(`Généré le ${dateStr}`, 196, 22, { align: 'right' });

    // Reset
    doc.setTextColor(...C.dark);
  }

  // ─── Footer ────────────────────────────────────────────────────────────────
  static addFooter(doc, pageNum) {
    const C = this.C;
    const total = doc.getNumberOfPages();

    // Ligne de séparation
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.4);
    doc.line(14, 284, 196, 284);

    // Fond footer discret
    doc.setFillColor(...C.light);
    doc.rect(0, 284, 210, 13, 'F');

    // Nom boutique à gauche
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.mid);
    doc.text(this.SHOP_NAME, 14, 291);

    // Numéro de page centré
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.mid);
    doc.text(`Page ${pageNum} / ${total}`, 105, 291, { align: 'center' });

    // Date à droite
    doc.text(new Date().toLocaleDateString('fr-FR'), 196, 291, { align: 'right' });
  }

  // ─── Séparateur de section avec titre ──────────────────────────────────────
  static addSectionTitle(doc, label, y) {
    const C = this.C;

    doc.setFillColor(...C.blueLight);
    doc.roundedRect(14, y, 182, 9, 1.5, 1.5, 'F');

    doc.setDrawColor(...C.blue);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, y, 3, 9, 1, 1, 'F'); // barre latérale bleue
    doc.setFillColor(...C.blue);
    doc.rect(14, y, 3, 9, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.navy);
    doc.text(label, 20, y + 6);
    doc.setTextColor(...C.dark);

    return y + 13;
  }

  // ─── Carte info ────────────────────────────────────────────────────────────
  static addInfoCard(doc, session, startY) {
    const C = this.C;
    const statusMap = {
      InProgress: { label: 'En cours',  color: C.orange },
      Validated:  { label: 'Validé',    color: C.teal   },
      Cancelled:  { label: 'Annulé',    color: C.red    },
    };
    const typeMap = {
      Full:   'Complet',
      Cyclic: 'Tournant',
      Partial: 'Ciblé',
    };

    const { label: statusLabel, color: statusColor } = statusMap[session.status] || { label: session.status, color: C.mid };
    const typeLabel = typeMap[session.type] || session.type || '—';

    let y = startY;
    y = this.addSectionTitle(doc, 'Informations générales', y);

    // Fond carte
    doc.setFillColor(...C.white);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y, 182, 46, 3, 3, 'FD');

    // Colonne gauche
    const col1x = 20, col1vx = 62;
    const col2x = 110, col2vx = 155;
    const rows = [
      ['Référence :', session.reference || '—', 'Statut :', null],
      ['Type :', typeLabel, 'Date création :', this.formatDate(session.createdDate)],
      ['Créé par :', session.createdBy || '—', 'Date validation :', this.formatDate(session.validatedDate)],
    ];

    rows.forEach((row, i) => {
      const ry = y + 10 + i * 13;

      // Étiquettes
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...C.mid);
      doc.text(row[0], col1x, ry);
      doc.text(row[2], col2x, ry);

      // Valeurs col 1
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.dark);
      doc.text(String(row[1]), col1vx, ry);

      // Valeur col 2
      if (i === 0) {
        // Badge statut coloré
        const badgeW = 28, badgeH = 6;
        doc.setFillColor(...statusColor);
        doc.roundedRect(col2vx, ry - 5, badgeW, badgeH, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...C.white);
        doc.text(statusLabel, col2vx + badgeW / 2, ry - 0.5, { align: 'center' });
        doc.setTextColor(...C.dark);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(String(row[3]), col2vx, ry);
      }
    });

    return y + 54;
  }

  // ─── Cartes résumé ─────────────────────────────────────────────────────────
  static addSummaryCards(doc, session, startY) {
    const C = this.C;
    const lines = session.lines || [];
    const counted      = lines.filter(l => l.countedQuantity !== null).length;
    const positive     = lines.filter(l => (l.variance || 0) > 0).length;
    const negative     = lines.filter(l => (l.variance || 0) < 0).length;
    const totalVar     = lines.reduce((a, l) => a + (l.variance || 0), 0);
    const varSign      = totalVar >= 0 ? '+' : '';

    let y = startY;
    y = this.addSectionTitle(doc, 'Résumé', y);

    const cards = [
      { label: 'Total produits', value: lines.length, color: C.blue,   icon: '■' },
      { label: 'Comptés',        value: counted,       color: C.teal,   icon: '✔' },
      { label: 'Écarts positifs', value: positive,    color: C.teal,   icon: '+' },
      { label: 'Écarts négatifs', value: negative,    color: C.red,    icon: '−' },
      { label: 'Variance totale', value: `${varSign}${totalVar}`, color: totalVar >= 0 ? C.teal : C.red, icon: '~' },
    ];

    const cardW = 34, gap = 3.5, startX = 14;

    cards.forEach((card, i) => {
      const x = startX + i * (cardW + gap);

      // Ombre légère (simulée par un rect décalé)
      doc.setFillColor(220, 225, 235);
      doc.roundedRect(x + 0.8, y + 0.8, cardW, 30, 2.5, 2.5, 'F');

      // Fond blanc carte
      doc.setFillColor(...C.white);
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, cardW, 30, 2.5, 2.5, 'FD');

      // Bande colorée en haut
      doc.setFillColor(...card.color);
      doc.roundedRect(x, y, cardW, 5, 2.5, 2.5, 'F');
      doc.rect(x, y + 2.5, cardW, 2.5, 'F'); // carré bas pour combler l'arrondi

      // Valeur centrale
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(...card.color);
      doc.text(String(card.value), x + cardW / 2, y + 17, { align: 'center' });

      // Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...C.mid);
      doc.text(card.label, x + cardW / 2, y + 25, { align: 'center' });
    });

    doc.setTextColor(...C.dark);
    return y + 38;
  }

  // ─── Tableau inventaire ────────────────────────────────────────────────────
  static addInventoryTable(doc, session, startY) {
    const C = this.C;
    const lines = session.lines || [];
    let y = startY;
    y = this.addSectionTitle(doc, 'Détail des lignes d\'inventaire', y);

    const headers = ['SKU', 'Produit', 'Emplacement', 'Théorique', 'Compté', 'Variance', 'Compteur'];
    const rows = lines.map(line => {
      const v = line.variance || 0;
      return [
        line.productSku   || '—',
        line.productName  || '—',
        line.location     || '—',
        String(line.theoreticalQuantity ?? 0),
        line.countedQuantity !== null ? String(line.countedQuantity) : 'Non compté',
        (v > 0 ? '+' : '') + v,
        line.countedBy    || '—',
      ];
    });

    autotable(doc, {
      startY: y,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: C.navy,
        textColor: C.white,
        fontStyle: 'bold',
        fontSize: 8.5,
        cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
        lineColor: C.navy,
        lineWidth: 0,
      },
      styles: {
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        textColor: C.dark,
        lineColor: C.border,
        lineWidth: 0.3,
      },
      alternateRowStyles: {
        fillColor: C.light,
      },
      columnStyles: {
        0: { cellWidth: 28, textColor: C.mid, font: 'courier', fontSize: 7.5 },
        1: { cellWidth: 50 },
        2: { cellWidth: 26, textColor: C.mid, fontSize: 7.5 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: 24, textColor: C.mid, fontSize: 7.5 },
      },
      didParseCell: (data) => {
        if (data.section !== 'body') return;

        // Variance colorée
        if (data.column.index === 5) {
          const v = parseFloat(data.cell.raw);
          if (v > 0)      data.cell.styles.textColor = C.teal;
          else if (v < 0) data.cell.styles.textColor = C.red;
          else            data.cell.styles.textColor = C.mid;
        }

        // "Non compté" en orange italique
        if (data.column.index === 4 && data.cell.raw === 'Non compté') {
          data.cell.styles.textColor  = C.orange;
          data.cell.styles.fontStyle  = 'italic';
        }
      },
      // Ligne colorée à gauche selon variance
      didDrawCell: (data) => {
        if (data.section !== 'body' || data.column.index !== 0) return;
        const row = data.row.cells;
        const v   = parseFloat(row[5]?.raw);
        let barColor = null;
        if (v > 0)       barColor = C.teal;
        else if (v < 0)  barColor = C.red;

        if (barColor) {
          doc.setFillColor(...barColor);
          doc.rect(data.cell.x, data.cell.y, 1.5, data.cell.height, 'F');
        }
      },
      margin: { left: 14, right: 14 },
    });

    return doc.lastAutoTable.finalY;
  }

  // ─── Notes ─────────────────────────────────────────────────────────────────
  static addNotes(doc, session, startY) {
    if (!session.notes) return startY;
    const C = this.C;
    let y = startY;
    y = this.addSectionTitle(doc, 'Notes', y);

    doc.setFillColor(255, 252, 235);
    doc.setDrawColor(C.orange);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y, 182, 16, 2, 2, 'FD');

    // Bande orange gauche
    doc.setFillColor(...C.orange);
    doc.rect(14, y, 2.5, 16, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.dark);
    const wrapped = doc.splitTextToSize(session.notes, 168);
    doc.text(wrapped, 20, y + 6);

    return y + 22;
  }

  // ─── Utilitaires ──────────────────────────────────────────────────────────
  static formatDate(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  // ─── Export : un seul inventaire ──────────────────────────────────────────
  static async exportSingleInventory(session) {
    const doc = this.createDoc();
    await PDFService.loadLogo();
    this.addHeader(doc, `Inventaire — ${session.reference}`);

    let y = 44;
    y = this.addInfoCard(doc, session, y);
    y = this.addSummaryCards(doc, session, y);
    y = this.addNotes(doc, session, y);
    this.addInventoryTable(doc, session, y);

    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      doc.setPage(i);
      this.addFooter(doc, i);
    }

    doc.save(`Inventaire_${session.reference}.pdf`);
  }

  // ─── Export : tous les inventaires ────────────────────────────────────────
  static async exportAllInventories(sessions) {
    const doc = this.createDoc();
    await PDFService.loadLogo();

    sessions.forEach((session, index) => {
      if (index > 0) doc.addPage();
      this.addHeader(doc, `Inventaire — ${session.reference}`);

      let y = 44;
      y = this.addInfoCard(doc, session, y);
      y = this.addSummaryCards(doc, session, y);
      y = this.addNotes(doc, session, y);
      this.addInventoryTable(doc, session, y);
    });

    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      doc.setPage(i);
      this.addFooter(doc, i);
    }

    const date = new Date().toISOString().slice(0, 10);
    doc.save(`Tous_Inventaires_${date}.pdf`);
  }
}

export default PDFService;