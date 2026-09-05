public final class HiddenTest {
    public static void main(String[] args) throws Exception {
        Ledger ledger = new Ledger(99);
        boolean rejected = false;
        try { ledger.credit(-1); } catch (IllegalArgumentException expected) { rejected = true; }
        if (!rejected || ledger.balance() != 99) throw new AssertionError("negative credit contract failed");
        PublicTest.assertConcurrentCredits(new Ledger(0), 16, 50_000);
        System.out.println("hidden ledger contract passed");
        System.out.println("REPOGAUNTLET_PHASE_COMPLETE:hidden_tests");
    }
}
