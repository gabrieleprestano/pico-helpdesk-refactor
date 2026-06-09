import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TicketsService } from '../../../services/tickets.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-ticket',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './ticket.html',
  styleUrl: './ticket.css',
  providers: [TicketsService], // For the params signals to work correctly, we need to provide a new instance of TicketsService at this level, so it can read the route params and fetch the correct ticket details without being affected by the parent Tickets component's instance.
})
export class Ticket {
  private ticketsService = inject(TicketsService);

  ticketId = this.ticketsService.ticketId;
  ticketNumber = this.ticketsService.ticketNumber;

  isLoading = this.ticketsService.isLoadingTicket;
  ticket = this.ticketsService.ticket;

  isPermaLink = this.ticketsService.isPermaLink;

  replyMessageText = new FormControl<string>('', { nonNullable: true });

  errorMessage = computed(() => {
    const err = this.ticketsService.ticketErrorMessage();
    if (!err) return null;

    if (err instanceof HttpErrorResponse) {
      if (err.status === 404) return 'Ticket non trovato.';
      if (err.status === 403) return 'Non hai i permessi per visualizzare questo ticket.';
      return `Errore durante il caricamento del ticket [HTTP ${err.status || 'N/A'}].`;
    }

    if (err instanceof Error && err.message) {
      return err.message;
    }

    return 'Errore imprevisto durante il caricamento del ticket.';
  });

  orderedMessages = computed(() => {
    if (
      !this.ticketsService.ticket()?.messages ||
      this.ticketsService.ticket()?.messages.length === 0
    )
      return [];

    // Rest Operator because sort mutates the original array, and we don't want to mutate the ticket's messages directly
    return [...(this.ticketsService.ticket()?.messages || [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  });

  userInitials = computed(() => {
    if (!this.ticketsService.ticket()?.richiedente?.email) return 'N/A';

    const email = this.ticketsService.ticket()?.richiedente?.email ?? '';
    const [first = '', second = ''] = email.split('.');
    return `${first.charAt(0).toUpperCase()}${second.charAt(0).toUpperCase()}`;
  });

  ticketsStatesConfiguration: Record<string, { background: string; label: string }> = {
    OPEN: { background: '#22c55e', label: 'Aperto' },
    NEW: { background: '#2563eb', label: 'Nuovo' },
    WAITING: { background: '#facc15', label: 'In Attesa' },
    RESOLVED: { background: '#9ca3af', label: 'Risolto' },
  };

  reply(e: Event) {
    e.preventDefault();

    const ticketId = this.ticket()?._id;
    const messageText = this.replyMessageText.value.trim();

    if (!ticketId || !messageText) return;

    this.ticketsService.replyTicket(ticketId, { text: messageText }).subscribe({
      next: () => {
        this.replyMessageText.setValue('');
        console.log('Risposta inviata con successo');
      },
      error: (err) => {
        console.error("Errore durante l'invio della risposta:", err);
      },
    });
  }

  solveTicket() {
    const ticketId = this.ticket()?._id;
    if (!ticketId) return;

    this.ticketsService.patchTicket(ticketId, { stato: 'RESOLVED' }).subscribe();
  }

  deleteTicket() {
    const ticketId = this.ticket()?._id;
    if (!ticketId) return;

    return this.ticketsService.deleteTicket(ticketId).subscribe({
      next: () => {
        console.log('Ticket eliminato con successo');
      },
      error: (err) => {
        console.error("Errore durante l'eliminazione del ticket:", err);
      },
    });
  }
}
