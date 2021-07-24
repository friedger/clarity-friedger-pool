(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-10-ft-standard.ft-trait)

(define-fungible-token wrapped-rewards)

;; get the token balance of owner
(define-read-only (get-balance-of (owner principal))
  (ok (ft-get-balance wrapped-rewards owner)))

;; returns the total number of tokens
(define-read-only (get-total-supply)
  (ok (ft-get-supply wrapped-rewards)))

;; returns the token name
(define-read-only (get-name)
  (ok "Wrapped Rewards"))

;; the symbol or "ticker" for this token
(define-read-only (get-symbol)
  (ok "WREW"))

;; the number of decimals used
(define-read-only (get-decimals)
  (ok u8))

;; Transfers tokens to a recipient
(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (if (is-eq tx-sender sender)
    (begin
      (try! (ft-transfer? wrapped-rewards amount sender recipient))
      (ok true)
    )
    (err u4)))

(define-public (get-token-uri)
  (ok (some u"https://pool.friedger.de/wrapped-rewards.json")))

