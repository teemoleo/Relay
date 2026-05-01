// Relay service for the Relay handover workflow.
import { apiRelayDataSource } from './apiRelayDataSource'
import type { RelayDataSource } from './relayDataSource'

export const relayService: RelayDataSource = apiRelayDataSource
