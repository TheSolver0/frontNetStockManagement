import jsPDF from 'jspdf';
import autotable from 'jspdf-autotable';

class PDFService {
  // ---------------- Paramètres de base ---------------------
  static COLORS = {
    primary: [0, 102, 204],
    dark: [40, 40, 40],
    gray: [100, 100, 100],
    lightGray: [245, 245, 245],
    white: [255, 255, 255],
    green: [39, 174, 96],
    red: [192, 57, 43],
    orange: [243, 156, 18],
  };

  static createDoc() {
    return new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  }

  // ----------- Header commun sur chaque page ----------------
  static addHeader(doc, title) {
    // Bande bleue en haut
    doc.setFillColor(...this.COLORS.primary);
    doc.rect(0, 0, 210, 28, 'F');

    // Titre
    doc.setTextColor(...this.COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(title, 14, 14);

    // Sous-titre date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 23);

    // Reset couleur
    doc.setTextColor(...this.COLORS.dark);
  }

  // ─── Footer commun sur chaque page ───────────
  static addFooter(doc, pageNum) {
    const totalPages = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(...this.COLORS.gray);
    doc.text(`Page ${pageNum} / ${totalPages}`, 105, 290, { align: 'center' });

    // Ligne séparatrice
    doc.setDrawColor(...this.COLORS.primary);
    doc.setLineWidth(0.3);
    doc.line(14, 285, 196, 285);
  }

  // ─── Carte info (référence, statut, créateur) ─
  static addInfoCard(doc, session, startY) {
    const status = session.status === "InProgress" ? 'En cours' : session.status === "Validated" ? 'Validé' : 'Annulé';
    const statusColor = session.status === "Validated" ? this.COLORS.green : session.status === "InProgress" ? this.COLORS.orange : this.COLORS.red;
    const type = session.type === "Full" ? 'Complet' : session.type === "Cyclic" ? 'Tournant' : 'Ciblé';

    // Fond carte
    doc.setFillColor(...this.COLORS.lightGray);
    doc.roundedRect(14, startY, 182, 42, 3, 3, 'F');

    // Colonne gauche
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...this.COLORS.dark);
    doc.text('Référence :', 20, startY + 10);
    doc.text('Type :', 20, startY + 22);
    doc.text('Créé par :', 20, startY + 34);

    doc.setFont('helvetica', 'normal');
    doc.text(session.reference || '—', 60, startY + 10);
    doc.text(type, 60, startY + 22);
    doc.text(session.createdBy || '—', 60, startY + 34);

    // Colonne droite
    doc.setFont('helvetica', 'bold');
    doc.text('Statut :', 115, startY + 10);
    doc.text('Date création :', 115, startY + 22);
    doc.text('Date validation :', 115, startY + 34);

    doc.setFont('helvetica', 'normal');

    // Statut avec couleur
    doc.setTextColor(...statusColor);
    doc.setFont('helvetica', 'bold');
    doc.text(status, 160, startY + 10);

    doc.setTextColor(...this.COLORS.dark);
    doc.setFont('helvetica', 'normal');
    doc.text(this.formatDate(session.createdDate), 160, startY + 22);
    doc.text(this.formatDate(session.validatedDate), 160, startY + 34);

    return startY + 50;
  }

  // ─── Cartes résumé (chiffres clés) ───────────
  static addSummaryCards(doc, session, startY) {
    const lines = session.lines || [];
    const counted = lines.filter(l => l.countedQuantity !== null).length;
    const positive = lines.filter(l => (l.variance || 0) > 0).length;
    const negative = lines.filter(l => (l.variance || 0) < 0).length;
    const totalVariance = lines.reduce((acc, l) => acc + (l.variance || 0), 0);

    const cards = [
      { label: 'Produits', value: lines.length, color: this.COLORS.primary },
      { label: 'Comptés', value: counted, color: this.COLORS.green },
      { label: 'Écarts +', value: positive, color: this.COLORS.green },
      { label: 'Écarts -', value: negative, color: this.COLORS.red },
      { label: 'Variance totale', value: (totalVariance >= 0 ? '+' : '') + totalVariance, color: totalVariance >= 0 ? this.COLORS.green : this.COLORS.red }
    ];

    const cardWidth = 34;
    const gap = 4;
    const startX = 14;

    cards.forEach((card, i) => {
      const x = startX + i * (cardWidth + gap);

      // Fond carte
      doc.setFillColor(...this.COLORS.white);
      doc.roundedRect(x, startY, cardWidth, 24, 2, 2, 'F');

      // Bord
      doc.setDrawColor(...card.color);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, startY, cardWidth, 24, 2, 2, 'S');

      // Ligne colorée en haut
      doc.setFillColor(...card.color);
      doc.roundedRect(x, startY, cardWidth, 3, 2, 2, 'F');

      // Valeur
      doc.setTextColor(...card.color);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(String(card.value), x + cardWidth / 2, startY + 13, { align: 'center' });

      // Label
      doc.setTextColor(...this.COLORS.gray);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(card.label, x + cardWidth / 2, startY + 20, { align: 'center' });
    });

    return startY + 32;
  }

  // ─── Tableau des lignes d'inventaire ──────────
  static addInventoryTable(doc, session, startY) {
    const lines = session.lines || [];

    const headers = ['SKU', 'Produit', 'Emplacement', 'Théorique', 'Compté', 'Variance', 'Compté par'];
    const rows = lines.map(line => {
      const variance = line.variance || 0;
      return [
        line.productSku || '—',
        line.productName || '—',
        line.location || '—',
        String(line.theoreticalQuantity ?? 0),
        line.countedQuantity !== null ? String(line.countedQuantity) : 'Non compté',
        (variance > 0 ? '+' : '') + variance,
        line.countedBy || '—'
      ];
    });

    autotable(doc,{
      startY: startY,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: this.COLORS.primary,
        textColor: this.COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 8.5,
        cellPadding: 3,
        textColor: this.COLORS.dark
      },
      alternateRowStyles: {
        fillColor: this.COLORS.lightGray
      },
      columnStyles: {
        0: { cellWidth: 30, textColor: this.COLORS.gray, font: 'courier' },
        1: { cellWidth: 50 },
        2: { cellWidth: 28, textColor: this.COLORS.gray },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: 24, textColor: this.COLORS.gray }
      },
      // Coloration de la colonne Variance selon la valeur
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const variance = parseFloat(data.cell.raw);
          if (variance > 0) {
            data.cell.styles.textColor = this.COLORS.green;
          } else if (variance < 0) {
            data.cell.styles.textColor = this.COLORS.red;
          }
        }
        // Ligne "Non compté" en orange
        if (data.section === 'body' && data.column.index === 4 && data.cell.raw === 'Non compté') {
          data.cell.styles.textColor = this.COLORS.orange;
          data.cell.styles.fontStyle = 'italic';
        }
      },
      // Gestion des sauts de page automatiques
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const variance = parseFloat(data.cell.raw);
          if (variance > 0) data.cell.styles.textColor = [39, 174, 96];
          else if (variance < 0) data.cell.styles.textColor = [192, 57, 43];
        }
        if (data.section === 'body' && data.column.index === 4 && data.cell.raw === 'Non compté') {
          data.cell.styles.textColor = [243, 156, 18];
          data.cell.styles.fontStyle = 'italic';
        }
      }
    });

    return doc.lastAutoTable.finalY;
  }

  // ------- Notes si présentes ------------------------ 
  static addNotes(doc, session, startY) {
    if (!session.notes) return startY;

    doc.setFillColor(...this.COLORS.lightGray);
    doc.roundedRect(14, startY, 182, 18, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...this.COLORS.dark);
    doc.text('Notes :', 20, startY + 7);

    doc.setFont('helvetica', 'normal');
    doc.text(session.notes, 48, startY + 7);

    return startY + 24;
  }

  // ─── Utilitaires ──────────────────────────────
  static formatDate(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // ─── EXPORT : UN SEUL inventaire ──────────────
  static exportSingleInventory(session) {
    const doc = this.createDoc();
    this.addHeader(doc, `Rapport Inventaire — ${session.reference}`);

    let y = 34;
    y = this.addInfoCard(doc, session, y);
    y = this.addSummaryCards(doc, session, y);
    y = this.addNotes(doc, session, y);
    y = this.addInventoryTable(doc, session, y);

    // Footer sur chaque page
    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      doc.setPage(i);
      this.addFooter(doc, i);
    }

    doc.save(`Inventaire_${session.reference}.pdf`);
  }

  // ─── EXPORT : TOUS les inventaires ────────────
  static exportAllInventories(sessions) {
    const doc = this.createDoc();
    let isFirstPage = true;

    sessions.forEach((session, index) => {
      // Nouvelle page sauf la première fois
      if (!isFirstPage) doc.addPage();
      isFirstPage = false;

      this.addHeader(doc, `Rapport Inventaire — ${session.reference}`);

      let y = 34;
      y = this.addInfoCard(doc, session, y);
      y = this.addSummaryCards(doc, session, y);
      y = this.addNotes(doc, session, y);
      y = this.addInventoryTable(doc, session, y);
    });

    // Footer sur chaque page
    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      doc.setPage(i);
      this.addFooter(doc, i);
    }

    const date = new Date().toISOString().slice(0, 10);
    doc.save(`Tous_Inventaires_${date}.pdf`);
  }
}

export default PDFService;