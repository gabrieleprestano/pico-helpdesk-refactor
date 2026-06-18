import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Service, signal } from '@angular/core';
import { environment } from '../environments/environment';
import {
  ReplyTicketPayload,
  Ticket,
  TicketStatus,
  UpdateTicketPayload,
} from '../models/types/tickets.types';
import { Observable } from 'rxjs/internal/Observable';
import { tap } from 'rxjs/internal/operators/tap';
import { UserService } from './user.service';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';

import { LucideTickets } from '@lucide/angular';
import { map, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Service()
export class TicketsService {
  protected http = inject(HttpClient);
  protected route = inject(ActivatedRoute);
  protected userService = inject(UserService);

  protected readonly apiUrl = environment.apiBaseUrl;
  protected readonly ticketsStreamURL = `${this.apiUrl}/tickets/stream?access_token=${encodeURIComponent(this.userService.getToken() || '')}`;

  constructor() {
    effect(() => {
      const ticketsFilters = this.activeTicketStatusFilters();

      if (ticketsFilters.length > 0) {
        localStorage.setItem('active_ticket_status_filters', JSON.stringify(ticketsFilters));
      }
    });
  }

  // toSignal to avoid multiple subscriptions to the same observable (route.paramMap)
  params = toSignal(
    this.route.paramMap.pipe(
      map((params) => ({
        ticketId: params.get('id'),
        ticketNumber: params.get('tk'),
      })),
    ),
    { initialValue: { ticketId: null, ticketNumber: null } },
  );

  // Params
  ticketId = computed(() => this.params().ticketId);
  ticketNumber = computed(() => this.params().ticketNumber);

  // Tickets Resource
  ticketsResource = rxResource({
    stream: () => {
      return this.http.get<Ticket[]>(`${this.apiUrl}/tickets`, {
        headers: this.userService.getHeaders(),
      });
    },
  });

  // Tickets, Loading & Error State
  readonly isLoadingTickets = this.ticketsResource.isLoading;
  readonly ticketsErrorMessage = this.ticketsResource.error;
  readonly tickets = this.ticketsResource.value;

  // Ticket Detail Resource
  private _isPermaLink = signal<boolean>(false);
  readonly isPermaLink = this._isPermaLink.asReadonly();

  ticketResource = rxResource({
    params: () => ({ id: this.ticketId(), tk: this.ticketNumber() }),
    stream: ({ params }) => {
      const { id, tk } = params;

      if (!id) return of(null);

      if (!tk) {
        return this.getTicketById(id).pipe(
          tap(() => {
            this._isPermaLink.set(false);
          }),
        );
      }

      return this.getPermalinkTicketById(id, tk).pipe(
        tap(() => {
          this._isPermaLink.set(true);
        }),
      );
    },
  });

  // Ticket Detail, Loading & Error State
  ticket = computed(() => this.ticketResource.value());
  isLoadingTicket = computed(() => this.ticketResource.isLoading());
  ticketErrorMessage = computed(() => this.ticketResource.error());

  // Altri Stati Ticket
  private _hasClickedTicket = signal<boolean>(false);
  readonly hasClickedTicket = this._hasClickedTicket.asReadonly();

  selectTicket() {
    this._hasClickedTicket.set(true);
  }

  deselectTicket() {
    this._hasClickedTicket.set(false);
  }

  // Stream
  private ticketsStream = signal<EventSource | null>(null);
  private ticketsStreamReconnectTimer = signal<ReturnType<typeof setTimeout> | null>(null);

  // Search Query
  private _searchQuery = signal<string | null>(null)

  // Filtri & filteredTickets
  private readonly SCALATO = 'SCALATO' as TicketStatus;
  private readonly TUTTI = 'ALL' as TicketStatus;

  private _activeTicketStatusFilters = signal<TicketStatus[]>(
    (() => {
      const savedFilters = localStorage.getItem('active_ticket_status_filters');
      return savedFilters ? (JSON.parse(savedFilters) as TicketStatus[]) : [this.SCALATO];
    })(),
  );
  readonly activeTicketStatusFilters = this._activeTicketStatusFilters.asReadonly();

  // Informazioni / Statistiche
  readonly informations = computed(() => ({
    totalTickets: this.tickets()?.length || 0,
    openTickets: this.tickets()?.filter((ticket) => ticket.stato === 'OPEN').length || 0,
    newTickets: this.tickets()?.filter((ticket) => ticket.stato === 'NEW').length || 0,
    waitingTickets: this.tickets()?.filter((ticket) => ticket.stato === 'WAITING').length || 0,
    resolvedTickets: this.tickets()?.filter((ticket) => ticket.stato === 'RESOLVED').length || 0,
  }));

  readonly statistics = computed(() => [
    {
      lucideIcon: LucideTickets,
      status: 'Nuovi',
      count: this.informations().newTickets || 0,
      color: '#2563eb',
    },
    {
      lucideIcon: LucideTickets,
      status: 'Aperti',
      count: this.informations().openTickets || 0,
      color: '#22c55e',
    },
    {
      lucideIcon: LucideTickets,
      status: 'In attesa',
      count: this.informations().waitingTickets || 0,
      color: '#facc15',
    },
    {
      lucideIcon: LucideTickets,
      status: 'Risolti',
      count: this.informations().resolvedTickets || 0,
      color: '#9ca3af',
    },
  ]);

  readonly filtriStati = computed(() => [
    { label: 'Scalati', value: this.SCALATO },
    { label: 'Tutti', value: this.TUTTI },

    { label: 'Nuovi', value: 'NEW' as TicketStatus },
    { label: 'Aperti', value: 'OPEN' as TicketStatus },
    { label: 'In Attesa', value: 'WAITING' as TicketStatus },
    { label: 'Risolti', value: 'RESOLVED' as TicketStatus },
  ]);

  // Ordine di priorità per lo stato dei ticket
  readonly priorityOrder: Record<TicketStatus, number> = {
    WAITING: 1,
    OPEN: 2,
    NEW: 3,
    RESOLVED: 4,
  };

  readonly filteredTickets = computed(() => {
    const filters = this.activeTicketStatusFilters();

    let filtered = this.tickets() || [];

    // Ricerca testuale su numero ticket, nome/email richiedente, titolo
    const query = this._searchQuery();

    if (query && query.trim() !== '') {
      filtered = filtered.filter((ticket) => {
        const matchesNumber = ticket.ticketNumber.toString().toLowerCase().includes(query);
        const matchesRequester = ticket.richiedente.nome.toLowerCase().includes(query) || ticket.richiedente.email.toLowerCase().includes(query);
        const matchesTitle = ticket.titolo?.toLowerCase().includes(query);

        return matchesNumber || matchesRequester || matchesTitle;
      });
    }

    // Filtri di stato/escalation
    if (!filters.includes(this.TUTTI)) {
      const isTicketScalato = filters.includes(this.SCALATO);
      const selectedStatuses = filters.filter((filter) => filter !== this.SCALATO);

      filtered = filtered.filter((ticket) => {
        // SE: è selezionato il filtro "Scalati" E il ticket NON è in escalation => ESCLUDI
        if (isTicketScalato && !ticket.escalation) {
          return false;
        }

        // SE: sono selezionati filtri di stato specifici (ex. "Nuovi", "Aperti", etc.) e lo stato del ticket NON è tra quelli selezionati => ESCLUDI
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(ticket.stato)) {
          return false;
        }
        return true;
      });
    }

    return [...filtered].sort((a, b) => {
      // Ordina per data di aggiornamento (decrescente) e, in caso di parità, per priorità di stato (se il filtro "Scalato" è attivo)
      const dateA = new Date(a.dataAggiornamento).getTime();
      const dateB = new Date(b.dataAggiornamento).getTime();

      if (dateB !== dateA) {
        return dateB - dateA; // Ordine decrescente per data
      }

      // SE la data è identica AL MILLISECONDO, allora usa la priorità di stato (se il filtro scalato è attivo)
      if (filters.includes(this.SCALATO)) {
        const priorityA = this.priorityOrder[a.stato] || Number.POSITIVE_INFINITY;
        const priorityB = this.priorityOrder[b.stato] || Number.POSITIVE_INFINITY;
        return priorityA - priorityB;
      }

      return 0;
    });
  });

  // Metodi
  setSearchQuery(query: string | null) {
    if (query === null || query.trim() === '') {
      this._searchQuery.set(null);
    } else {
      this._searchQuery.set(query.trim());
    }
  }

  startTicketChangeStream() {
    if (this.ticketsStream() !== null) return;

    const reconnectTimer = this.ticketsStreamReconnectTimer();
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      this.ticketsStreamReconnectTimer.set(null);
    }

    const stream = new EventSource(this.ticketsStreamURL);
    this.ticketsStream.set(stream);

    stream.addEventListener('ready', () => {
      console.log('Stream dei ticket pronto.');
    });

    stream.addEventListener('tickets-changed', () => {
      console.log('I ticket sono cambiati sul server! Ricarico...');
      this.ticketsResource.reload();
    });

    stream.onerror = () => {
      console.error('Errore nello stream dei ticket. Tentativo di riconnessione in corso...');

      if (stream.readyState === EventSource.CLOSED) {
        this.stopTicketsChangeStream();

        this.ticketsStreamReconnectTimer.set(
          setTimeout(() => {
            console.log('Tentativo di riconnessione allo stream dei ticket...');
            this.startTicketChangeStream();
          }, 2000),
        );
      }
    };
  }

  stopTicketsChangeStream(): void {
    const reconnectTimer = this.ticketsStreamReconnectTimer();

    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      this.ticketsStreamReconnectTimer.set(null);
    }

    if (this.ticketsStream() !== null) {
      this.ticketsStream()?.close();
      this.ticketsStream.set(null);
    }
  }

  toggleStatusFilter(status: TicketStatus) {
    this._activeTicketStatusFilters.update((filters) => {
      if (status === this.TUTTI) {
        return filters.includes(this.TUTTI) ? [] : [this.TUTTI];
      }

      if (status === this.SCALATO) {
        if (filters.includes(this.TUTTI)) {
          return [this.SCALATO];
        }

        return filters.includes(this.SCALATO)
          ? filters.filter((s) => s !== this.SCALATO)
          : [...filters, this.SCALATO];
      }

      const withoutAll = filters.filter((s) => s !== this.TUTTI);

      if (filters.includes(status)) {
        return withoutAll.filter((s) => s !== status);
      }

      return [...withoutAll, status];
    });
  }

  getTicketById(ticketId: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/tickets/${ticketId}`, {
      headers: this.userService.getHeaders(),
    });
  }

  getPermalinkTicketById(ticketId: string, ticketNumber: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/tickets/${ticketId}/${ticketNumber}`, {
      headers: this.userService.getHeaders(),
    });
  }

  patchTicket(ticketId: string, payload: UpdateTicketPayload): Observable<Ticket> {
    return this.http
      .patch<Ticket>(`${this.apiUrl}/tickets/${ticketId}`, payload, {
        headers: this.userService.getHeaders(),
      })
      .pipe(
        tap((ticketAggiornato) => {
          this.tickets.update((ticketsAttuali) =>
            (ticketsAttuali ?? []).map((t) =>
              t._id === ticketAggiornato._id ? ticketAggiornato : t,
            ),
          );

          if (this.ticketId() === ticketAggiornato._id) {
            this.ticketResource.reload();
          }
        }),
      );
  }

  replyTicket(
    ticketId: string,
    payload: ReplyTicketPayload,
  ): Observable<{ ok: boolean; ticket: Ticket }> {
    return this.http
      .post<{
        ok: boolean;
        ticket: Ticket;
      }>(`${this.apiUrl}/tickets/${ticketId}/reply`, payload, {
        headers: this.userService.getHeaders(),
      })
      .pipe(
        tap((resultPayload) => {
          const ticketAggiornato = resultPayload.ticket;
          this.tickets.update((ticketsAttuali) =>
            (ticketsAttuali ?? []).map((t) =>
              t._id === ticketAggiornato._id ? ticketAggiornato : t,
            ),
          );

          if (this.ticketId() === ticketAggiornato._id) {
            this.ticketResource.reload();
          }
        }),
      );
  }

  deleteTicket(ticketId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/tickets/${ticketId}`, {
        headers: this.userService.getHeaders(),
      })
      .pipe(
        tap(() => {
          this.tickets.update((ticketsAttuali) =>
            (ticketsAttuali ?? []).filter((t) => t._id !== ticketId),
          );

          if (this.ticketId() === ticketId) {
            this.ticketResource.reload();
          }
        }),
      );
  }
}
