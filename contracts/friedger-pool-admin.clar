;; Configuration
(define-constant user-compensation u1000000) ;; 1 STX
;; stx address: ST33GW755MQQP6FZ58S423JJ23GBKK5ZKH3MGR55N
;; btx address: myfTfju9XSMRusaY2qTitSEMSchsWRA441
(define-constant pool-pox-address {hashbytes: 0xc70e1ca5a5ef633fe5464821ca421c173997f388, version: 0x00})

;;
;; vault functions
;;

;; balance per cycle
(define-map vaults uint int)
(define-map payins uint uint)

;; only the contract itself can make payouts
(define-private (payout (user principal) (ustx uint) (cycle uint))
  (begin
    (map-set vaults cycle (- (default-to 0 (map-get? vaults cycle)) (to-int ustx)))
    (as-contract (stx-transfer? ustx tx-sender user))))

;; Anybody can pay into the contract. The amount will be accounted for the given cycle.
(define-public (payin (ustx uint) (cycle uint))
  (begin
    (map-set vaults cycle (+ (default-to 0 (map-get? vaults cycle)) (to-int ustx)))
    (map-set payins cycle (+ (default-to u0 (map-get? payins cycle)) ustx))
    (stx-transfer? ustx tx-sender (as-contract tx-sender))))

;;
;; stacking functions
;;

(define-data-var pool-account (optional principal) none)

;; stacking constants
(define-constant cycles (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11))

(define-map total-stacked-stxs uint uint)
(define-map stacked-stxs {stacker: principal, cycle: uint}
  {
    amount-ustx: uint,
    stacked-ustx: uint,
    until-burn-ht: (optional uint),
    rewards: (optional uint)})
(define-map unaudited-rewards uint uint)

;; Backport of .pox's burn-height-to-reward-cycle
(define-read-only (burn-height-to-reward-cycle (height uint))
    (let (
        (pox-info (unwrap-panic (contract-call? 'ST000000000000000000002AMW42H.pox get-pox-info)))
    )
    (/ (- height (get first-burnchain-block-height pox-info)) (get reward-cycle-length pox-info)))
)

;; Backport of .pox's reward-cycle-to-burn-height
(define-read-only (reward-cycle-to-burn-height (cycle uint))
    (let (
        (pox-info (unwrap-panic (contract-call? 'ST000000000000000000002AMW42H.pox get-pox-info)))
    )
    (+ (get first-burnchain-block-height pox-info) (* cycle (get reward-cycle-length pox-info))))
)

(define-read-only (height-to-reward-cycle (height uint))
  (burn-height-to-reward-cycle (at-block (unwrap-panic (get-block-info? id-header-hash height)) burn-block-height)))


;; What's the current PoX reward cycle?
(define-private (current-pox-reward-cycle)
    (burn-height-to-reward-cycle burn-block-height))


(define-read-only (get-next-cycle)
  (+ (current-pox-reward-cycle) u1)
)

(define-private (pox-delegate-stx-and-stack (amount-ustx uint) (until-burn-ht (optional uint)) (locking-period uint))
  (begin
    (let ((ignore-result-revoke (contract-call? 'ST000000000000000000002AMW42H.pox revoke-delegate-stx))
          (start-block-ht (+ burn-block-height u1)))
      (match (contract-call? 'ST000000000000000000002AMW42H.pox delegate-stx amount-ustx (unwrap! (var-get pool-account) err-pool-not-active) until-burn-ht none)
        success
          (let ((stacker tx-sender))
            (match (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox delegate-stack-stx stacker amount-ustx pool-pox-address start-block-ht locking-period))
              stack-success (ok stack-success)
              stack-error (print (err (to-uint stack-error)))))
        error (err (to-uint error))))))


(define-private (insert-stacked-stxs (cycle-index uint) (context {stacker: principal, cycle: uint, amount-ustx: uint,
    stacked-ustx: uint, until-burn-ht: (optional uint), locking-period: uint, result: bool}))
  (let ((cycle (+ (get cycle context) cycle-index))
      (stacked-ustx (get stacked-ustx context)))
    (if (< cycle-index (get locking-period context))
      (begin
        (map-set total-stacked-stxs cycle
          (+ (default-to u0 (map-get? total-stacked-stxs cycle))
            stacked-ustx))
        (let ((result
              (map-insert stacked-stxs {stacker: (get stacker context), cycle: cycle}
                {amount-ustx: (get amount-ustx context), stacked-ustx: (get stacked-ustx context),
                  until-burn-ht: (get until-burn-ht context), rewards: none})))
        (merge context {result: (and (get result context) result)})))
      context)))


(define-private (delegatedly-stack (stacker principal) (amount-ustx uint)
      (until-burn-ht (optional uint)) (cycle uint) (locking-period uint))
  (begin
      (asserts! (>= (stx-get-balance tx-sender) amount-ustx) err-not-enough-funds)
      (asserts! (is-none (map-get? stacked-stxs {stacker: stacker, cycle: cycle})) err-already-stacked)
      (match (pox-delegate-stx-and-stack amount-ustx until-burn-ht locking-period)
        success-pox
              (begin
                (asserts! (get result
                  (fold insert-stacked-stxs cycles {stacker: stacker, cycle: cycle,
                    amount-ustx: amount-ustx, stacked-ustx: (get lock-amount success-pox),
                    until-burn-ht: until-burn-ht, locking-period: locking-period, result: true}))
                    err-map-function-failed)
                (ok success-pox))
        error-pox (err error-pox))))



;; every user can delegate and stack their stacks
(define-public (delegate-stx (amount-ustx uint) (stacker principal)
                  (until-burn-ht (optional uint))
                  (pox-addr (optional (tuple (hashbytes (buff 20)) (version (buff 1)))))
                  (user-addr (tuple (hashbytes (buff 20)) (version (buff 1))))
                  (locking-period uint))
  (let ((cycle (get-next-cycle)))
    (asserts! (is-eq (some stacker) (var-get pool-account)) err-delegate-invalid-stacker)
    (delegatedly-stack stacker amount-ustx until-burn-ht cycle locking-period)))


;; anybody can close the pool within the window before the start of the next cycle
;; the caller is rewarded 1 STX
(define-public (stack-aggregation-commit (reward-cycle uint))
  (let ((cycle-start (reward-cycle-to-burn-height reward-cycle)))
    (if (and (>= burn-block-height (- cycle-start u50)) (< burn-block-height cycle-start))
      (match (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox stack-aggregation-commit pool-pox-address reward-cycle))
        success (begin
                  (unwrap! (payout tx-sender user-compensation reward-cycle) err-payout-failed)
                  (ok success))
        error (err-pox-stack-aggregation-commit error))
      err-commit-not-allowed-now)))


;; only one user can call this function
(define-data-var delegation-enabler (optional principal) none)
(define-public (allow-contract-caller (this-contract principal))
  (match (var-get delegation-enabler)
    enabler (ok enabler)
    (let ((enabler tx-sender))
      (unwrap! (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox allow-contract-caller this-contract none)) err-allow-contract-caller-failed)
      (var-set delegation-enabler (some enabler))
      (var-set pool-account (some this-contract))
      (ok enabler))))

;;submit reward btc transactions
(define-public (submit-reward-tx (block { version: (buff 4), parent: (buff 32), merkle-root: (buff 32), timestamp: (buff 4), nbits: (buff 4), nonce: (buff 4), height: uint })
    (tx {version: (buff 4),
      ins: (list 8
        {outpoint: {hash: (buff 32), index: (buff 4)}, scriptSig: (buff 256), sequence: (buff 4)}),
      outs: (list 8
        {value: (buff 8), scriptPubKey: (buff 128)}),
      locktime: (buff 4)})
    (proof { tx-index: uint, hashes: (list 12 (buff 32)), tree-depth: uint }))
  (match (contract-call? .friedger-pool-audit submit-reward-tx block tx proof)
    success (begin
      (unwrap! (payout tx-sender (* u2 user-compensation) (height-to-reward-cycle (get height block))) err-payout-failed)
      (ok success))
    error (err error)))

(define-public (submit-unaudited-rewards (amount uint) (cycle uint))
  (begin
    (asserts! (> amount u0) err-non-positive-amount)
    (map-set unaudited-rewards cycle (+ (get-unaudited-rewards cycle) amount))
    (stx-transfer? amount tx-sender (as-contract tx-sender))))

;; request payout
(define-public (claim-rewards (cycle uint))
  (let ((current-cycle (print (current-pox-reward-cycle)))
    (amount (unwrap! (get-rewards tx-sender cycle) (err u0))))
    (asserts! (> current-cycle cycle) err-payout-too-early)
    (payout tx-sender amount cycle)))

(define-read-only (get-unaudited-rewards (cycle uint))
  (default-to u0 (map-get? unaudited-rewards cycle)))

;; check rewards balance
(define-read-only (get-rewards (user principal) (cycle uint))
  (let ((total (unwrap! (map-get? total-stacked-stxs cycle) err-invalid-cycle))
          (user-stxs (unwrap! (get stacked-ustx (map-get? stacked-stxs {stacker: user, cycle: cycle})) err-payout-no-rewards))
          (rewards (+ (contract-call? .friedger-pool-audit get-rewards cycle) (get-unaudited-rewards cycle))))
    (ok (/ (* user-stxs rewards) total))))

(define-read-only (get-vault-balance (cycle uint))
  (default-to 0 (map-get? vaults cycle)))

(define-read-only (get-reward-balance (cycle uint))
  (- (to-int (contract-call? .friedger-pool-audit get-rewards cycle))
  (to-int (default-to u0 (map-get? payins cycle)))))

;;
;; error handling
;;
(define-constant err-not-enough-funds (err u4021)) ;; payment required
(define-constant err-allow-contract-caller-failed (err u601))
(define-constant err-delegate-below-minimum (err u602))
(define-constant err-delegate-invalid-stacker (err u603))
(define-constant err-commit-not-allowed-now (err u604))
(define-constant err-already-stacked (err u605))
(define-constant err-invalid-cycle (err u606))
(define-constant err-map-function-failed (err u607))
(define-constant err-payout-failed (err u701))
(define-constant err-payout-too-early (err u702))
(define-constant err-payout-no-rewards (err u703))
(define-constant err-non-positive-amount (err u704))
(define-constant err-pool-not-active (err u999))

(define-private (err-pox-stack-aggregation-commit (code int))
  (err (to-uint (* 1000 code))))
