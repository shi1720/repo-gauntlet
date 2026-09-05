public final class Ledger {
    private volatile long balance;

    public Ledger(long openingBalance) {
        this.balance = openingBalance;
    }

    public void credit(long amount) {
        if (amount < 0) throw new IllegalArgumentException("amount must be positive");
        long observed = balance;
        Thread.yield();
        balance = observed + amount;
    }

    public long balance() {
        return balance;
    }
}

