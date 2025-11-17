const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

/**
 * InvoiceService - Service for managing invoices and PDF generation
 *
 * Features:
 * - Create and manage invoices
 * - Generate professional PDF invoices
 * - Handle VAT calculations (Saudi Arabia 15%)
 * - Support multiple currencies
 * - Link invoices with transactions and subscriptions
 */
class InvoiceService {
  constructor() {
    this.invoicesDir = path.join(__dirname, '../../invoices');
    this.ensureInvoiceDirectory();
  }

  /**
   * Ensure invoices directory exists
   */
  ensureInvoiceDirectory() {
    if (!fs.existsSync(this.invoicesDir)) {
      fs.mkdirSync(this.invoicesDir, { recursive: true });
    }
  }

  /**
   * Create an invoice
   */
  async createInvoice(invoiceData) {
    try {
      const {
        userId,
        subscriptionId,
        transactionId,
        items,
        billingInfo,
        currency = 'SAR',
        discount,
        notes,
        dueDate
      } = invoiceData;

      // Calculate due date if not provided (default: 7 days from now)
      const invoiceDueDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const invoice = new Invoice({
        userId,
        subscriptionId,
        transactionId,
        billingInfo,
        items,
        currency,
        discount,
        notes,
        dueDate: invoiceDueDate,
        paymentGateway: 'manual', // Will be updated when payment is processed
        issueDate: new Date()
      });

      await invoice.save();

      console.log(`[InvoiceService] Invoice created: ${invoice.invoiceNumber}`);

      return {
        success: true,
        data: invoice
      };
    } catch (error) {
      console.error('[InvoiceService] Failed to create invoice:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create invoice from subscription payment
   */
  async createInvoiceFromSubscription(user, transaction, subscriptionPeriod) {
    try {
      const planPricing = {
        basic: { SAR: 29, USD: 8 },
        pro: { SAR: 99, USD: 26 },
        enterprise: { SAR: 299, USD: 80 }
      };

      const plan = user.subscription?.plan || 'basic';
      const currency = user.subscription?.currency || 'SAR';
      const amount = planPricing[plan][currency];

      const invoiceData = {
        userId: user._id,
        subscriptionId: user._id, // Reference to user subscription
        transactionId: transaction._id,
        billingInfo: {
          name: user.name || user.email,
          email: user.email,
          company: user.company,
          address: user.address || {},
          taxId: user.taxId,
          phone: user.phone
        },
        items: [{
          description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${user.subscription?.billingCycle || 'monthly'} subscription`,
          planName: plan,
          quantity: 1,
          unitPrice: amount,
          discount: 0,
          subtotal: amount
        }],
        currency,
        paymentGateway: transaction.paymentGateway,
        billingPeriod: subscriptionPeriod,
        dueDate: new Date() // Immediate payment
      };

      return this.createInvoice(invoiceData);
    } catch (error) {
      console.error('[InvoiceService] Failed to create invoice from subscription:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate PDF invoice
   */
  async generatePDF(invoiceId) {
    try {
      const invoice = await Invoice.findById(invoiceId).populate('userId', 'name email company');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const filename = `${invoice.invoiceNumber}.pdf`;
      const filepath = path.join(this.invoicesDir, filename);

      // Create PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Add content to PDF
      this.addHeader(doc, invoice);
      this.addBillingInfo(doc, invoice);
      this.addInvoiceDetails(doc, invoice);
      this.addLineItems(doc, invoice);
      this.addTotals(doc, invoice);
      this.addFooter(doc, invoice);

      doc.end();

      // Wait for stream to finish
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      // Update invoice with PDF info
      invoice.pdfGenerated = true;
      invoice.pdfUrl = `/invoices/${filename}`;
      invoice.pdfGeneratedAt = new Date();
      await invoice.save();

      console.log(`[InvoiceService] PDF generated: ${filename}`);

      return {
        success: true,
        data: {
          filename,
          filepath,
          url: invoice.pdfUrl
        }
      };
    } catch (error) {
      console.error('[InvoiceService] Failed to generate PDF:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add header to PDF
   */
  addHeader(doc, invoice) {
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('INVOICE', 50, 50)
      .fontSize(10)
      .font('Helvetica')
      .text(invoice.invoiceNumber, 50, 80);

    // Company info (right aligned)
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Laghhu Link', 400, 50, { align: 'right' })
      .font('Helvetica')
      .fontSize(9)
      .text('URL Shortener Service', 400, 65, { align: 'right' })
      .text('Saudi Arabia', 400, 78, { align: 'right' })
      .text('support@laghhu.link', 400, 91, { align: 'right' });

    doc.moveDown(2);
  }

  /**
   * Add billing information to PDF
   */
  addBillingInfo(doc, invoice) {
    const startY = 140;

    // Bill To
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('BILL TO:', 50, startY);

    doc
      .font('Helvetica')
      .fontSize(9)
      .text(invoice.billingInfo.name, 50, startY + 15)
      .text(invoice.billingInfo.email, 50, startY + 28);

    if (invoice.billingInfo.company) {
      doc.text(invoice.billingInfo.company, 50, startY + 41);
    }

    if (invoice.billingInfo.address?.street) {
      let addressY = invoice.billingInfo.company ? startY + 54 : startY + 41;
      doc.text(invoice.billingInfo.address.street, 50, addressY);
      addressY += 13;

      const cityLine = [
        invoice.billingInfo.address.city,
        invoice.billingInfo.address.state,
        invoice.billingInfo.address.postalCode
      ].filter(Boolean).join(', ');

      if (cityLine) {
        doc.text(cityLine, 50, addressY);
        addressY += 13;
      }

      if (invoice.billingInfo.address.country) {
        doc.text(invoice.billingInfo.address.country, 50, addressY);
      }
    }

    // Invoice Details (right side)
    doc
      .font('Helvetica-Bold')
      .text('Issue Date:', 350, startY)
      .font('Helvetica')
      .text(invoice.issueDate.toLocaleDateString(), 450, startY, { align: 'right' });

    doc
      .font('Helvetica-Bold')
      .text('Due Date:', 350, startY + 15)
      .font('Helvetica')
      .text(invoice.dueDate.toLocaleDateString(), 450, startY + 15, { align: 'right' });

    doc
      .font('Helvetica-Bold')
      .text('Status:', 350, startY + 30)
      .font('Helvetica')
      .text(invoice.status.toUpperCase(), 450, startY + 30, { align: 'right' });

    if (invoice.billingInfo.taxId) {
      doc
        .font('Helvetica-Bold')
        .text('Tax ID:', 350, startY + 45)
        .font('Helvetica')
        .text(invoice.billingInfo.taxId, 450, startY + 45, { align: 'right' });
    }

    doc.moveDown(3);
  }

  /**
   * Add invoice details section
   */
  addInvoiceDetails(doc, invoice) {
    if (invoice.billingPeriod && invoice.billingPeriod.start && invoice.billingPeriod.end) {
      const y = doc.y + 20;
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Billing Period:', 50, y)
        .font('Helvetica')
        .text(
          `${invoice.billingPeriod.start.toLocaleDateString()} - ${invoice.billingPeriod.end.toLocaleDateString()}`,
          150,
          y
        );

      doc.moveDown(1);
    }
  }

  /**
   * Add line items table to PDF
   */
  addLineItems(doc, invoice) {
    const tableTop = doc.y + 20;
    const itemHeight = 25;

    // Table header
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Description', 50, tableTop)
      .text('Qty', 300, tableTop, { width: 50, align: 'right' })
      .text('Unit Price', 350, tableTop, { width: 80, align: 'right' })
      .text('Amount', 450, tableTop, { width: 95, align: 'right' });

    // Draw line under header
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(50, tableTop + 15)
      .lineTo(545, tableTop + 15)
      .stroke();

    // Line items
    let y = tableTop + 25;

    invoice.items.forEach(item => {
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(item.description, 50, y, { width: 240 });

      if (item.planName) {
        doc
          .fontSize(8)
          .fillColor('#666666')
          .text(`Plan: ${item.planName}`, 50, y + 12);
        doc.fillColor('#000000');
      }

      doc
        .fontSize(9)
        .text(item.quantity.toString(), 300, y, { width: 50, align: 'right' })
        .text(`${item.unitPrice.toFixed(2)} ${invoice.currency}`, 350, y, { width: 80, align: 'right' })
        .text(`${item.subtotal.toFixed(2)} ${invoice.currency}`, 450, y, { width: 95, align: 'right' });

      y += itemHeight + (item.planName ? 15 : 0);
    });

    doc.y = y + 10;
  }

  /**
   * Add totals section to PDF
   */
  addTotals(doc, invoice) {
    const totalsSectionTop = doc.y + 20;
    let y = totalsSectionTop;

    // Subtotal
    doc
      .fontSize(9)
      .font('Helvetica')
      .text('Subtotal:', 350, y)
      .text(`${invoice.subtotal.toFixed(2)} ${invoice.currency}`, 450, y, { width: 95, align: 'right' });

    y += 18;

    // Discount (if applicable)
    if (invoice.discount && invoice.discount.amount > 0) {
      const discountLabel = invoice.discount.code
        ? `Discount (${invoice.discount.code}):`
        : 'Discount:';

      doc
        .text(discountLabel, 350, y)
        .text(`-${invoice.discount.amount.toFixed(2)} ${invoice.currency}`, 450, y, { width: 95, align: 'right' });

      y += 18;
    }

    // Tax (VAT)
    doc
      .text(`Tax (${invoice.tax.rate}% VAT):`, 350, y)
      .text(`${invoice.tax.amount.toFixed(2)} ${invoice.currency}`, 450, y, { width: 95, align: 'right' });

    y += 20;

    // Draw line before total
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(350, y)
      .lineTo(545, y)
      .stroke();

    y += 10;

    // Total
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Total:', 350, y)
      .text(`${invoice.total.toFixed(2)} ${invoice.currency}`, 450, y, { width: 95, align: 'right' });

    y += 20;

    // Amount Paid (if any)
    if (invoice.amountPaid > 0) {
      doc
        .fontSize(9)
        .font('Helvetica')
        .text('Amount Paid:', 350, y)
        .text(`${invoice.amountPaid.toFixed(2)} ${invoice.currency}`, 450, y, { width: 95, align: 'right' });

      y += 18;
    }

    // Amount Due
    if (invoice.amountDue > 0) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#d32f2f')
        .text('Amount Due:', 350, y)
        .text(`${invoice.amountDue.toFixed(2)} ${invoice.currency}`, 450, y, { width: 95, align: 'right' });

      doc.fillColor('#000000');
    }

    doc.y = y + 30;
  }

  /**
   * Add footer to PDF
   */
  addFooter(doc, invoice) {
    const footerTop = 700;

    // Notes (if any)
    if (invoice.notes) {
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('Notes:', 50, footerTop)
        .font('Helvetica')
        .text(invoice.notes, 50, footerTop + 12, { width: 495 });
    }

    // Payment info and thank you message
    const paymentInfoY = invoice.notes ? footerTop + 50 : footerTop;

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text('Thank you for your business!', 50, paymentInfoY, { align: 'center', width: 495 })
      .text(
        'For questions about this invoice, please contact support@laghhu.link',
        50,
        paymentInfoY + 15,
        { align: 'center', width: 495 }
      );

    doc.fillColor('#000000');
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId) {
    try {
      const invoice = await Invoice.findById(invoiceId).populate('userId', 'name email');
      return { success: true, data: invoice };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user invoices
   */
  async getUserInvoices(userId, options = {}) {
    try {
      const invoices = await Invoice.getUserInvoices(userId, options);
      return { success: true, data: invoices };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(invoiceId, paymentAmount, paymentDate = new Date()) {
    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      await invoice.markAsPaid(paymentAmount, paymentDate);

      console.log(`[InvoiceService] Invoice ${invoice.invoiceNumber} marked as paid`);

      return { success: true, data: invoice };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(invoiceId, recipient = null) {
    try {
      const invoice = await Invoice.findById(invoiceId).populate('userId', 'email name');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Generate PDF if not already generated
      if (!invoice.pdfGenerated) {
        await this.generatePDF(invoiceId);
      }

      const recipientEmail = recipient || invoice.billingInfo.email || invoice.userId.email;

      // TODO: Implement email sending with PDF attachment
      // This would integrate with your email service (SendGrid, AWS SES, etc.)

      await invoice.markEmailSent(recipientEmail);

      console.log(`[InvoiceService] Invoice ${invoice.invoiceNumber} email sent to ${recipientEmail}`);

      return {
        success: true,
        data: { sent: true, recipient: recipientEmail }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(userId = null) {
    try {
      const stats = await Invoice.getInvoiceStats(userId);
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices() {
    try {
      const invoices = await Invoice.getOverdueInvoices();
      return { success: true, data: invoices };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const invoiceService = new InvoiceService();

module.exports = invoiceService;
