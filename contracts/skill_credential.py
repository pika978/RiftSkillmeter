from algopy import ARC4Contract, GlobalState, String, UInt64
from algopy import arc4, itxn, Txn, Global


class SkillCredential(ARC4Contract):
    """
    Issues one ARC-69 NFT per completed SkillMeter course.
    Admin (SkillMeter backend wallet) calls issue_certificate().
    Anyone can call verify_certificate() to read on-chain metadata.
    """
    admin: GlobalState[arc4.Address]
    total_issued: GlobalState[UInt64]

    @arc4.abimethod(create='require')
    def create_application(self) -> None:
        self.admin = arc4.Address(Txn.sender)
        self.total_issued = UInt64(0)

    @arc4.abimethod
    def issue_certificate(
        self,
        recipient: arc4.Address,
        course_name: String,
        score: UInt64,
        cert_hash: String,
    ) -> UInt64:  # returns ASA ID
        # Only admin (SkillMeter backend) can call this
        assert Txn.sender == self.admin.value, 'Unauthorized'

        # Build ARC-69 metadata JSON in note field
        metadata = (
            '{"standard":"arc69",'
            '"description":"SkillMeter.ai verified credential",'
            '"course":"' + course_name + '",'
            '"score":' + str(score) + ','
            '"hash":"' + cert_hash + '"}'
        )

        # Inner transaction: mint NFT
        asset_id = itxn.AssetConfig(
            total=1,
            decimals=0,
            default_frozen=False,
            unit_name='CERT',
            asset_name='SkillMeter | ' + course_name,
            manager=Global.current_application_address,
            note=metadata,
        ).submit().created_asset.id

        # Transfer NFT to recipient
        itxn.AssetTransfer(
            xfer_asset=asset_id,
            asset_receiver=recipient,
            asset_amount=1,
        ).submit()

        self.total_issued.value += 1
        return asset_id
