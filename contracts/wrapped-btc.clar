(impl-trait 'ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM4DF2YCW.sip-10-ft-standard.ft-trait)
(use-trait ft 'ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM4DF2YCW.sip-10-ft-standard.ft-trait)

(define-fungible-token wbtc)

(define-public (get-name)
  (ok "Wrapped Bitcoin"))

(define-public (get-symbol)
  (ok "WBTC"))

(define-public (get-decimals)
  (ok u8))

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (try! (ft-transfer? wbtc amount sender recipient))
    (print memo)
    (ok true)))

(define-public (get-balance (user principal))
  (ok (ft-get-balance wbtc user)))

(define-public (get-total-supply)
  (ok (ft-get-supply wbtc)))

(define-private (create-swap)
  (contract-call? .btc-ft-swap create-swap amount btc-receiver amount wbtc-receiver))

;; convert btc into wbtc
;; 1. mint wbtc to this contract
;; 2. create swap
(define-public (wrap (amount uint) (enabler (buff 40)) (this-contract <ft>))
  (let ((btc-sender tx-sender))
    (ft-mint wbtc amount (as-contract tx-sender))
    (as-contract (create-swap amount enabler amount btc-sender this-contract))))

;; 1. submit-swap
;; 2. pay fees
(define-public (finish-wrap (id uint)
    (block { version: (buff 4), parent: (buff 32), merkle-root: (buff 32), timestamp: (buff 4), nbits: (buff 4), nonce: (buff 4), height: uint })
    (tx {version: (buff 4),
      ins: (list 8
        {outpoint: {hash: (buff 32), index: (buff 4)}, scriptSig: (buff 256), sequence: (buff 4)}),
      outs: (list 8
        {value: (buff 8), scriptPubKey: (buff 128)}),
      locktime: (buff 4)})
    (proof { tx-index: uint, hashes: (list 12 (buff 32)), tree-depth: uint })
    (this-contract <ft>))
  (submit-swap id block tx proof this-contract)
  (payout-fees id))

;; convert wbtc into btc
;; 1. create swap
;; 2.
(define-public (unwrap (amount uint) (my-btc-address (buff 40)) (enabler (buff 40)) (this-contract <ft>))
  (match (map-get? enablers btc-receiver)
  enabler (create-swap amount my-btc-addr amount (as-contract tx-sender) (get stx-address enabler) this-contract)
  ERR-INVALID_ENABLER))

(define-public (finish-unwrap (id uint)
    (block { version: (buff 4), parent: (buff 32), merkle-root: (buff 32), timestamp: (buff 4), nbits: (buff 4), nonce: (buff 4), height: uint })
    (tx {version: (buff 4),
      ins: (list 8
        {outpoint: {hash: (buff 32), index: (buff 4)}, scriptSig: (buff 256), sequence: (buff 4)}),
      outs: (list 8
        {value: (buff 8), scriptPubKey: (buff 128)}),
      locktime: (buff 4)})
    (proof { tx-index: uint, hashes: (list 12 (buff 32)), tree-depth: uint })
    (this-contract <ft>))
  (let ((result (unwrap! (submit-swap id block tx proof this-contract) err-invalid-unwrap)))
    (ft-burn wbtc (as-contract tx-sender) (get amount result))
    (payout-fees id)))


(define-public (add-collateral (amount-ustx uint) (enabler (buff 40)))
  (try! (stx-transfer? amount-ustx tx-sender (as-contract tx-sender)))
  (map-set enablers enabler {amount-ustx: amount-ustx}))
