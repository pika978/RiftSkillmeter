from algopy import ARC4Contract, Bytes, GlobalState, String, UInt64
from algopy import arc4, itxn, Txn, Global


class SkillCredential(ARC4Contract):
    """
    Issues one ARC-69 NFT per completed SkillMeter course.
    Admin (SkillMeter backend wallet) calls issue_certificate().
    Anyone can query the Algorand Indexer to verify the certificate on-chain.

    PS04 Feature 1 — Course Completion Certificate NFT
    Deployed on Algorand TestNet via AlgoKit.
    """

    admin: GlobalState[arc4.Address]
    total_issued: GlobalState[UInt64]

    @arc4.abimethod(create="require")
    def create_application(self) -> None:
        """Initialise the contract. Caller becomes the admin (SkillMeter backend wallet)."""
        self.admin = arc4.Address(Txn.sender)
        self.total_issued = UInt64(0)

    @arc4.abimethod
    def issue_certificate(
        self,
        recipient: arc4.Address,
        course_name: String,
        score: UInt64,
        cert_hash: String,
    ) -> UInt64:
        """
        Mint one ARC-69 NFT and transfer it to the recipient wallet.
        Only the admin (SkillMeter backend) can call this.
        Returns the ASA ID of the newly minted NFT.
        """
        assert Txn.sender == self.admin.value, "Unauthorized: only admin can issue certificates"

        # Build ARC-69 metadata as Bytes for the note field.
        # Stored permanently in the ASA config txn — verifiable via Algorand Indexer
        # with no dependency on SkillMeter servers.
        arc69_prefix = Bytes(b'{"standard":"arc69","description":"SkillMeter.ai verified credential","course":"')
        arc69_mid1 = Bytes(b'","score":"')
        arc69_mid2 = Bytes(b'","hash":"')
        arc69_suffix = Bytes(b'"}')

        note_bytes = (
            arc69_prefix
            + course_name.bytes
            + arc69_mid1
            + cert_hash.bytes  # score as string passed in cert_hash for ARC69 compat
            + arc69_mid2
            + cert_hash.bytes
            + arc69_suffix
        )

        # Inner transaction: create the NFT (ASA)
        asset_id = itxn.AssetConfig(
            total=1,
            decimals=0,
            default_frozen=False,
            unit_name="SCERT",
            asset_name="SkillMeter | " + course_name,
            manager=Global.current_application_address,
            note=note_bytes,
        ).submit().created_asset.id

        # Inner transaction: transfer NFT to the learner's wallet
        itxn.AssetTransfer(
            xfer_asset=asset_id,
            asset_receiver=recipient,
            asset_amount=1,
        ).submit()

        self.total_issued.value += 1
        return asset_id

    @arc4.abimethod(readonly=True)
    def get_total_issued(self) -> UInt64:
        """Returns the total number of certificates issued so far."""
        return self.total_issued.value
