# Wallet safety

## Important

For trading, **do not connect your main Phantom wallet**.

Create a separate wallet in Phantom specifically for this bot and only fund it with money you are comfortable losing. Keep your main wallet separate and use it for normal holdings.

The bot should never ask for, receive, store, or display a seed phrase or private key.

## Why

A trading bot interacts with tokens, decentralized exchanges, transaction requests and potentially untrusted token contracts. Keeping a small dedicated trading wallet limits the damage if a transaction, integration, token approval or third-party service is compromised.

## Product requirement

Before the first wallet connection, show this warning:

> **Use a separate trading wallet**
>
> Don't connect your main Phantom wallet. Create a new wallet in Phantom for trading and keep only the amount you are comfortable losing in it.
>
> We never need your recovery phrase or private key.

Require the user to acknowledge the warning before continuing. Do not block public market scanning for users who don't connect a wallet.

## Signing rule

The app prepares transactions; the user's wallet reviews and signs them. Never silently sign, auto-submit, or hide the destination, amount, slippage or fees.
